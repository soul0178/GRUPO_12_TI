package edu.unsa.epcc.loans.sanction.service;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.sanction.dto.SanctionResponse;
import edu.unsa.epcc.loans.sanction.entity.Sanction;
import edu.unsa.epcc.loans.sanction.entity.SanctionStatus;
import edu.unsa.epcc.loans.sanction.entity.SanctionType;
import edu.unsa.epcc.loans.sanction.mapper.SanctionMapper;
import edu.unsa.epcc.loans.sanction.repository.SanctionRepository;
import edu.unsa.epcc.loans.user.entity.User;
import edu.unsa.epcc.loans.user.service.UserService;
import jakarta.persistence.EntityManager;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Crea, confirma, rechaza y consulta las sanciones de los usuarios (RF-08). */
@Slf4j
@Service
@RequiredArgsConstructor
public class SanctionService {

    private static final long SECONDS_PER_DAY = Duration.ofDays(1).toSeconds();

    private final SanctionRepository sanctionRepository;
    private final SanctionMapper sanctionMapper;
    private final UserService userService;
    private final EntityManager entityManager;
    private final Clock clock;

    /**
     * Indica si el usuario tiene una sanción ACTIVE vigente. Antes de responder pasa a FINISHED las sanciones
     * cuya fecha de fin ya se cumplió. Lo usan préstamos y reservas para rechazar a un usuario sancionado.
     */
    @Transactional
    public boolean hasActiveSanction(Long userId) {
        finishExpiredSanctions();
        return sanctionRepository.existsByUserIdAndStatus(userId, SanctionStatus.ACTIVE);
    }

    /**
     * Crea la sanción automática por devolución tardía: queda ACTIVE por ceil(atraso / 24 horas) días, mínimo 1.
     * Lanza NotFoundException si el usuario no existe.
     */
    @Transactional
    public SanctionResponse createOverdueSanction(Long userId, Long loanId, Duration overdue) {
        long days = Math.max(1, Math.ceilDiv(overdue.toSeconds(), SECONDS_PER_DAY));
        Sanction sanction = newSanction(userId, loanId, SanctionType.OVERDUE);
        sanction.setReason("Devolución tardía del préstamo " + loanId);
        activate(sanction, days);
        log.info("Sanción por atraso creada: usuario={}, préstamo={}, días={}", userId, loanId, days);
        return sanctionMapper.toResponse(sanctionRepository.save(sanction));
    }

    /** Crea una sanción SUGERIDA por posible daño del ítem; un ADMIN debe confirmarla o rechazarla. */
    @Transactional
    public SanctionResponse suggestDamageSanction(Long userId, Long loanId, String reason) {
        Sanction sanction = newSanction(userId, loanId, SanctionType.DAMAGE);
        sanction.setReason(reason);
        sanction.setStatus(SanctionStatus.SUGGESTED);
        log.info("Sanción por daño sugerida: usuario={}, préstamo={}", userId, loanId);
        return sanctionMapper.toResponse(sanctionRepository.save(sanction));
    }

    /** Confirma una sanción sugerida con los días indicados. Lanza BusinessException si no está SUGGESTED. */
    @Transactional
    public SanctionResponse confirm(Long id, int days) {
        Sanction sanction = getSanction(id);
        requireSuggested(sanction, "confirmar");
        activate(sanction, days);
        log.info("Sanción {} confirmada por {} días", id, days);
        return sanctionMapper.toResponse(sanction);
    }

    /** Rechaza una sanción sugerida. Lanza BusinessException si no está SUGGESTED. */
    @Transactional
    public SanctionResponse reject(Long id) {
        Sanction sanction = getSanction(id);
        requireSuggested(sanction, "rechazar");
        sanction.setStatus(SanctionStatus.REJECTED);
        log.info("Sanción {} rechazada", id);
        return sanctionMapper.toResponse(sanction);
    }

    /** Lista sanciones paginadas con filtro opcional de estado (para el personal). */
    @Transactional
    public PageResponse<SanctionResponse> findAll(SanctionStatus status, Pageable pageable) {
        finishExpiredSanctions();
        return PageResponse.from(sanctionRepository.search(null, status, pageable).map(sanctionMapper::toResponse));
    }

    /** Lista las sanciones de un usuario, con filtro opcional de estado. */
    @Transactional
    public PageResponse<SanctionResponse> findByUser(Long userId, SanctionStatus status, Pageable pageable) {
        finishExpiredSanctions();
        return PageResponse.from(sanctionRepository.search(userId, status, pageable).map(sanctionMapper::toResponse));
    }

    private Sanction newSanction(Long userId, Long loanId, SanctionType type) {
        userService.findById(userId);
        Sanction sanction = new Sanction();
        sanction.setUser(entityManager.getReference(User.class, userId));
        sanction.setType(type);
        sanction.setLoanId(loanId);
        return sanction;
    }

    private void activate(Sanction sanction, long days) {
        Instant now = Instant.now(clock);
        sanction.setStatus(SanctionStatus.ACTIVE);
        sanction.setStartAt(now);
        sanction.setEndAt(now.plus(days, ChronoUnit.DAYS));
    }

    private void requireSuggested(Sanction sanction, String action) {
        if (sanction.getStatus() != SanctionStatus.SUGGESTED) {
            throw new BusinessException("Solo se puede " + action + " una sanción sugerida");
        }
    }

    private void finishExpiredSanctions() {
        sanctionRepository.finishExpired(Instant.now(clock), SanctionStatus.ACTIVE, SanctionStatus.FINISHED);
    }

    private Sanction getSanction(Long id) {
        return sanctionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe la sanción con id " + id));
    }
}
