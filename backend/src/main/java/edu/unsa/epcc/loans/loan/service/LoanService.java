package edu.unsa.epcc.loans.loan.service;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.inventory.dto.ItemResponse;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.service.ItemService;
import edu.unsa.epcc.loans.loan.dto.CreateLoanRequest;
import edu.unsa.epcc.loans.loan.dto.LoanResponse;
import edu.unsa.epcc.loans.loan.dto.ReturnLoanRequest;
import edu.unsa.epcc.loans.loan.entity.Guarantee;
import edu.unsa.epcc.loans.loan.entity.Loan;
import edu.unsa.epcc.loans.loan.entity.LoanStatus;
import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import edu.unsa.epcc.loans.loan.mapper.LoanMapper;
import edu.unsa.epcc.loans.loan.repository.LoanRepository;
import edu.unsa.epcc.loans.reservation.service.ReservationService;
import edu.unsa.epcc.loans.sanction.service.PolicySettingsService;
import edu.unsa.epcc.loans.sanction.service.SanctionService;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.entity.User;
import edu.unsa.epcc.loans.user.service.UserService;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Registra la entrega y la devolución de ítems y consulta los préstamos (RF-04, RF-06 y RF-07). */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final LoanMapper loanMapper;
    private final UserService userService;
    private final ItemService itemService;
    private final SanctionService sanctionService;
    private final PolicySettingsService policySettingsService;
    private final ReservationService reservationService;
    private final EntityManager entityManager;
    private final Clock clock;

    /**
     * Registra la entrega de un ítem. El vencimiento es la hora actual más el plazo de la categoría.
     * Lanza BusinessException si el usuario está desactivado o sancionado, ya tiene el máximo de préstamos sin
     * devolver, el ítem no está disponible o falta la garantía que la categoría exige.
     * También lo rechaza si otro usuario tiene una reserva que se solapa; una reserva propia pasa a FULFILLED.
     */
    @Transactional
    public LoanResponse create(CreateLoanRequest request, Long deliveredById) {
        UserResponse user = userService.findById(request.userId());
        validateUserCanBorrow(user);

        // Si algo falla después de marcar el ítem como prestado, la transacción se revierte completa.
        ItemResponse item = itemService.markAsLoaned(request.itemId());
        if (item.category().requiresGuarantee() && request.guarantee() == null) {
            throw new BusinessException("La categoría " + item.category().name() + " exige registrar una garantía");
        }

        Instant now = Instant.now(clock);
        Instant dueAt = now.plus(Duration.ofHours(item.category().maxLoanHours()));
        reservationService.registerDelivery(item.id(), user.id(), now, dueAt);
        Loan loan = new Loan();
        loan.setUser(entityManager.getReference(User.class, user.id()));
        loan.setItem(entityManager.getReference(Item.class, item.id()));
        loan.setDeliveredBy(entityManager.getReference(User.class, deliveredById));
        loan.setCheckedOutAt(now);
        loan.setDueAt(dueAt);
        loan.setDeliveryCondition(request.deliveryCondition());
        loan.setDeliveryObservations(request.deliveryObservations());
        if (request.guarantee() != null) {
            Guarantee guarantee = new Guarantee();
            guarantee.setLoan(loan);
            guarantee.setType(request.guarantee().type());
            guarantee.setDescription(request.guarantee().description());
            loan.setGuarantee(guarantee);
        }

        Loan saved = saveRejectingDuplicateOpenLoan(loan);
        log.info("Préstamo {} registrado: usuario={}, ítem={}", saved.getId(), user.id(), item.code());
        return loanMapper.toResponse(saved, now);
    }

    /**
     * Registra la devolución de un préstamo. Devuelve el ítem al inventario (o lo deja fuera de servicio si volvió
     * dañado), marca la garantía como devuelta, crea una sanción por atraso si venció y sugiere una sanción por daño
     * si el estado físico empeoró. Lanza BusinessException si el préstamo ya fue devuelto.
     */
    @Transactional
    public LoanResponse returnLoan(Long id, ReturnLoanRequest request, Long returnedById) {
        Loan loan = getLoan(id);
        if (loan.getReturnedAt() != null) {
            throw new BusinessException("El préstamo ya fue devuelto");
        }
        Instant now = Instant.now(clock);
        Long userId = loan.getUser().getId();
        boolean overdue = loan.statusAt(now) == LoanStatus.OVERDUE;
        Duration overdueTime = Duration.between(loan.getDueAt(), now);

        loan.setReturnedAt(now);
        loan.setReturnCondition(request.returnCondition());
        loan.setReturnObservations(request.returnObservations());
        loan.setReturnedBy(entityManager.getReference(User.class, returnedById));
        if (loan.getGuarantee() != null) {
            loan.getGuarantee().setReturned(true);
        }
        itemService.markAsReturned(loan.getItem().getId(), request.returnCondition() == PhysicalCondition.DAMAGED);

        if (overdue) {
            sanctionService.createOverdueSanction(userId, loan.getId(), overdueTime);
        }
        if (request.returnCondition().isWorseThan(loan.getDeliveryCondition())) {
            sanctionService.suggestDamageSanction(userId, loan.getId(), "Posible daño en el préstamo " + loan.getId()
                    + ": el ítem pasó de " + loan.getDeliveryCondition().getLabel() + " a "
                    + request.returnCondition().getLabel());
        }
        log.info("Préstamo {} devuelto (atrasado={})", loan.getId(), overdue);
        return loanMapper.toResponse(loan, now);
    }

    /**
     * Lista préstamos paginados con filtros opcionales de usuario, ítem y estado. El estado se calcula:
     * ACTIVE (sin devolver y dentro del plazo), OVERDUE (sin devolver y vencido) o RETURNED.
     */
    @Transactional(readOnly = true)
    public PageResponse<LoanResponse> search(Long userId, Long itemId, LoanStatus status, Pageable pageable) {
        Instant now = Instant.now(clock);
        Boolean returned = status == null ? null : status == LoanStatus.RETURNED;
        Boolean overdue = status == null || status == LoanStatus.RETURNED ? null : status == LoanStatus.OVERDUE;
        return PageResponse.from(loanRepository.search(userId, itemId, returned, overdue, now, pageable)
                .map(loan -> loanMapper.toResponse(loan, now)));
    }

    /** Devuelve un préstamo por id. Lanza NotFoundException si no existe. */
    @Transactional(readOnly = true)
    public LoanResponse findById(Long id) {
        return loanMapper.toResponse(getLoan(id), Instant.now(clock));
    }

    private void validateUserCanBorrow(UserResponse user) {
        if (!user.active()) {
            throw new BusinessException("El usuario está desactivado y no puede recibir préstamos");
        }
        if (sanctionService.hasActiveSanction(user.id())) {
            throw new BusinessException("El usuario tiene una sanción activa y no puede recibir préstamos");
        }
        int maxActive = policySettingsService.get().maxActiveItems();
        long open = loanRepository.countByUserIdAndReturnedAtIsNull(user.id());
        if (open >= maxActive) {
            throw new BusinessException("El usuario ya tiene " + open + " préstamos sin devolver (máximo "
                    + maxActive + ")");
        }
    }

    /** La base impide dos préstamos abiertos del mismo ítem (RNF-02); aquí se traduce el error a un mensaje claro. */
    private Loan saveRejectingDuplicateOpenLoan(Loan loan) {
        try {
            return loanRepository.saveAndFlush(loan);
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException("El ítem ya tiene un préstamo sin devolver");
        }
    }

    private Loan getLoan(Long id) {
        return loanRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe el préstamo con id " + id));
    }
}
