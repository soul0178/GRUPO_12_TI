package edu.unsa.epcc.loans.reservation.service;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.common.util.LimaTime;
import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.loan.entity.Loan;
import edu.unsa.epcc.loans.reservation.dto.AvailabilityResponse;
import edu.unsa.epcc.loans.reservation.dto.BusyRangeResponse;
import edu.unsa.epcc.loans.reservation.dto.BusyRangeResponse.BusyType;
import edu.unsa.epcc.loans.reservation.dto.CreateReservationRequest;
import edu.unsa.epcc.loans.reservation.dto.ReservationResponse;
import edu.unsa.epcc.loans.reservation.entity.Reservation;
import edu.unsa.epcc.loans.reservation.entity.ReservationStatus;
import edu.unsa.epcc.loans.reservation.mapper.ReservationMapper;
import edu.unsa.epcc.loans.reservation.repository.ReservationRepository;
import edu.unsa.epcc.loans.sanction.service.PolicySettingsService;
import edu.unsa.epcc.loans.sanction.service.SanctionService;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.entity.User;
import edu.unsa.epcc.loans.user.service.UserService;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea, cancela y consulta reservas, y ofrece a préstamos las comprobaciones de la entrega (RF-04, RF-05).
 * Las reservas PENDING cuyo plazo de recojo venció se pasan a EXPIRED al consultar, sin tarea programada.
 * El ítem se lee con EntityManager (no con ItemService) para no crear un ciclo con inventario, que consulta
 * aquí si un ítem tiene reservas pendientes antes de darlo de baja.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ReservationMapper reservationMapper;
    private final UserService userService;
    private final SanctionService sanctionService;
    private final PolicySettingsService policySettingsService;
    private final EntityManager entityManager;
    private final Clock clock;

    /**
     * Crea una reserva del usuario sobre un ítem y un rango futuro. Lanza BusinessException si el usuario está
     * desactivado o sancionado, el rango es inválido o supera el plazo de la categoría, el ítem no se puede
     * reservar, el usuario llegó al límite de reservas pendientes + préstamos, o el rango se solapa con otra
     * reserva o con el préstamo en curso del ítem.
     */
    @Transactional
    public ReservationResponse create(CreateReservationRequest request, Long userId) {
        Instant now = Instant.now(clock);
        expirePendingReservations(now);
        UserResponse user = userService.findById(userId);
        validateUserCanReserve(user);
        Item item = getItem(request.itemId());
        validateRange(request, item, now);
        validateItemCanBeReserved(item, request.startAt());

        Reservation reservation = new Reservation();
        reservation.setUser(entityManager.getReference(User.class, user.id()));
        reservation.setItem(item);
        reservation.setStartAt(request.startAt());
        reservation.setEndAt(request.endAt());
        reservation.setStatus(ReservationStatus.PENDING);
        Reservation saved = saveRejectingOverlap(reservation);
        log.info("Reserva {} creada: usuario={}, ítem={}", saved.getId(), userId, item.getCode());
        return reservationMapper.toResponse(saved);
    }

    /**
     * Cancela una reserva PENDING. Solo su dueño puede cancelarla (AccessDeniedException si es de otro);
     * lanza BusinessException si ya no está pendiente.
     */
    @Transactional
    public ReservationResponse cancel(Long id, Long userId) {
        expirePendingReservations(Instant.now(clock));
        Reservation reservation = getReservation(id);
        if (!reservation.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("Solo puede cancelar sus propias reservas");
        }
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessException("Solo se pueden cancelar reservas pendientes (estado actual: "
                    + reservation.getStatus().getLabel() + ")");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
        log.info("Reserva {} cancelada", id);
        return reservationMapper.toResponse(reservation);
    }

    /** Lista reservas paginadas con filtros opcionales de usuario, ítem y estado. */
    @Transactional
    public PageResponse<ReservationResponse> search(Long userId, Long itemId, ReservationStatus status,
                                                    Pageable pageable) {
        expirePendingReservations(Instant.now(clock));
        return PageResponse.from(reservationRepository.search(userId, itemId, status, pageable)
                .map(reservationMapper::toResponse));
    }

    /** Disponibilidad de un ítem en [from, to): libre si ninguna reserva ni préstamo se solapa y se puede reservar. */
    @Transactional
    public AvailabilityResponse availability(Long itemId, Instant from, Instant to) {
        if (!to.isAfter(from)) {
            throw new BusinessException("La fecha de fin debe ser posterior a la de inicio");
        }
        expirePendingReservations(Instant.now(clock));
        Item item = getItem(itemId);
        List<BusyRangeResponse> busy = new ArrayList<>();
        for (Loan loan : reservationRepository.findOpenLoans(itemId)) {
            if (loan.getCheckedOutAt().isBefore(to) && loan.getDueAt().isAfter(from)) {
                busy.add(new BusyRangeResponse(loan.getCheckedOutAt(), loan.getDueAt(), BusyType.LOAN));
            }
        }
        for (Reservation reservation : reservationRepository.findOverlapping(itemId, from, to,
                ReservationStatus.PENDING)) {
            busy.add(new BusyRangeResponse(reservation.getStartAt(), reservation.getEndAt(), BusyType.RESERVATION));
        }
        busy.sort((a, b) -> a.startAt().compareTo(b.startAt()));
        return new AvailabilityResponse(itemId, from, to, busy.isEmpty() && isReservable(item), busy);
    }

    /** Indica si el ítem tiene reservas pendientes vigentes; inventario lo usa para impedir la baja. */
    @Transactional
    public boolean hasPendingReservations(Long itemId) {
        expirePendingReservations(Instant.now(clock));
        return reservationRepository.existsByItemIdAndStatus(itemId, ReservationStatus.PENDING);
    }

    /**
     * Comprobación de la entrega de un ítem durante [from, to): lanza BusinessException si otro usuario tiene una
     * reserva pendiente que se solapa, y convierte a FULFILLED la reserva pendiente del propio usuario, si existe.
     */
    @Transactional
    public void registerDelivery(Long itemId, Long userId, Instant from, Instant to) {
        expirePendingReservations(Instant.now(clock));
        List<Reservation> overlapping = reservationRepository.findOverlapping(itemId, from, to,
                ReservationStatus.PENDING);
        for (Reservation reservation : overlapping) {
            if (!reservation.getUser().getId().equals(userId)) {
                throw new BusinessException("El ítem tiene una reserva de otro usuario que se solapa con el "
                        + "préstamo (a partir de " + LimaTime.format(reservation.getStartAt()) + ")");
            }
        }
        overlapping.forEach(reservation -> reservation.setStatus(ReservationStatus.FULFILLED));
    }

    private void expirePendingReservations(Instant now) {
        Instant limit = now.minus(Duration.ofMinutes(policySettingsService.get().reservationExpirationMinutes()));
        reservationRepository.expirePending(limit, now, ReservationStatus.PENDING, ReservationStatus.EXPIRED);
    }

    private void validateUserCanReserve(UserResponse user) {
        if (!user.active()) {
            throw new BusinessException("El usuario está desactivado y no puede reservar");
        }
        if (sanctionService.hasActiveSanction(user.id())) {
            throw new BusinessException("El usuario tiene una sanción activa y no puede reservar");
        }
        int max = policySettingsService.get().maxActiveItems();
        long used = reservationRepository.countByUserIdAndStatus(user.id(), ReservationStatus.PENDING)
                + reservationRepository.countOpenLoans(user.id());
        if (used >= max) {
            throw new BusinessException("Ya tiene " + used + " reservas pendientes y préstamos sin devolver "
                    + "(máximo " + max + ")");
        }
    }

    private void validateRange(CreateReservationRequest request, Item item, Instant now) {
        if (!request.startAt().isAfter(now)) {
            throw new BusinessException("La reserva debe empezar en el futuro");
        }
        if (!request.endAt().isAfter(request.startAt())) {
            throw new BusinessException("La fecha de fin debe ser posterior a la de inicio");
        }
        Duration max = Duration.ofHours(item.getCategory().getMaxLoanHours());
        if (Duration.between(request.startAt(), request.endAt()).compareTo(max) > 0) {
            throw new BusinessException("La reserva no puede durar más de " + item.getCategory().getMaxLoanHours()
                    + " horas (plazo de la categoría " + item.getCategory().getName() + ")");
        }
    }

    private void validateItemCanBeReserved(Item item, Instant startAt) {
        if (!isReservable(item)) {
            throw new BusinessException("El ítem " + item.getCode() + " no se puede reservar (estado: "
                    + item.getStatus().getLabel() + ")");
        }
        for (Loan loan : reservationRepository.findOpenLoans(item.getId())) {
            if (loan.getDueAt().isAfter(startAt)) {
                throw new BusinessException("El ítem está prestado hasta " + LimaTime.format(loan.getDueAt()));
            }
        }
    }

    private boolean isReservable(Item item) {
        return item.getStatus() == ItemStatus.AVAILABLE || item.getStatus() == ItemStatus.ON_LOAN;
    }

    /** La base impide reservas PENDING solapadas del mismo ítem (RNF-02); aquí se traduce el error a un mensaje. */
    private Reservation saveRejectingOverlap(Reservation reservation) {
        try {
            return reservationRepository.saveAndFlush(reservation);
        } catch (DataIntegrityViolationException exception) {
            throw new BusinessException("El ítem ya está reservado en ese horario");
        }
    }

    private Item getItem(Long id) {
        Item item = entityManager.find(Item.class, id);
        if (item == null) {
            throw new NotFoundException("No existe el ítem con id " + id);
        }
        return item;
    }

    private Reservation getReservation(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe la reserva con id " + id));
    }
}
