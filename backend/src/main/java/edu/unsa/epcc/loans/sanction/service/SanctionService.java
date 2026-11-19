package edu.unsa.epcc.loans.sanction.service;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.sanction.dto.SanctionResponse;
import edu.unsa.epcc.loans.sanction.entity.DamageLevel;
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
import java.util.EnumSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea, confirma, rechaza, reduce, levanta y consulta las sanciones de los usuarios (RF-08). Las duraciones y la
 * reincidencia salen de {@link SanctionRules}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SanctionService {

    private static final long SECONDS_PER_DAY = Duration.ofDays(1).toSeconds();

    private static final Set<SanctionStatus> COUNTED_STATUSES = EnumSet.of(SanctionStatus.ACTIVE, SanctionStatus.FINISHED);

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
     * Crea la sanción automática por devolución tardía: queda ACTIVE por un día por cada día de atraso (mínimo 1,
     * máximo {@link SanctionRules#MAX_OVERDUE_DAYS}), más el recargo por reincidencia.
     * Lanza NotFoundException si el usuario no existe.
     */
    @Transactional
    public SanctionResponse createOverdueSanction(Long userId, Long loanId, Duration overdue) {
        long overdueDays = Math.min(SanctionRules.MAX_OVERDUE_DAYS,
                Math.max(1, Math.ceilDiv(overdue.toSeconds(), SECONDS_PER_DAY)));
        Sanction sanction = newSanction(userId, SanctionType.OVERDUE);
        sanction.setLoanId(loanId);
        sanction.setReason("Devolución tardía del préstamo " + loanId);
        int days = SanctionRules.daysWithRecidivism((int) overdueDays, previousSanctions(userId));
        activate(sanction, days);
        log.info("Sanción por atraso creada: usuario={}, préstamo={}, días={}", userId, loanId, days);
        return sanctionMapper.toResponse(sanctionRepository.save(sanction));
    }

    /**
     * Crea la sanción automática por no recoger una reserva a tiempo: la más corta de todas
     * ({@link SanctionRules#NO_SHOW_DAYS} día), más el recargo por reincidencia.
     */
    @Transactional
    public SanctionResponse createNoShowSanction(Long userId, Long reservationId) {
        Sanction sanction = newSanction(userId, SanctionType.NO_SHOW);
        sanction.setReservationId(reservationId);
        sanction.setReason("No recogió la reserva " + reservationId + " dentro del plazo");
        int days = SanctionRules.daysWithRecidivism(SanctionRules.NO_SHOW_DAYS, previousSanctions(userId));
        activate(sanction, days);
        log.info("Sanción por reserva no recogida creada: usuario={}, reserva={}, días={}", userId, reservationId, days);
        return sanctionMapper.toResponse(sanctionRepository.save(sanction));
    }

    /**
     * Crea la sanción automática por pérdida del ítem: la más larga de todas ({@link SanctionRules#LOSS_DAYS} días).
     * Es una falta grave: si el usuario supera {@link SanctionRules#MAX_GRAVE_FAULTS} faltas graves, queda baneado.
     * Un ADMIN puede reducirla o levantarla si hubo un error.
     */
    @Transactional
    public SanctionResponse createLossSanction(Long userId, Long loanId, String reason) {
        Sanction sanction = newSanction(userId, SanctionType.LOSS);
        sanction.setLoanId(loanId);
        sanction.setReason(reason);
        activate(sanction, SanctionRules.LOSS_DAYS);
        Sanction saved = sanctionRepository.save(sanction);
        banIfTooManyGraveFaults(saved);
        log.info("Sanción por pérdida creada: usuario={}, préstamo={}, baneado={}", userId, loanId, saved.isCausedBan());
        return sanctionMapper.toResponse(saved);
    }

    /**
     * Crea una sanción SUGERIDA por daño del ítem con el nivel registrado al recibirlo; un ADMIN debe confirmarla
     * (puede cambiar el nivel o los días) o rechazarla.
     */
    @Transactional
    public SanctionResponse suggestDamageSanction(Long userId, Long loanId, DamageLevel level, String reason) {
        Sanction sanction = newSanction(userId, SanctionType.DAMAGE);
        sanction.setLoanId(loanId);
        sanction.setDamageLevel(level);
        sanction.setReason(reason);
        sanction.setStatus(SanctionStatus.SUGGESTED);
        log.info("Sanción por daño sugerida: usuario={}, préstamo={}, nivel={}", userId, loanId, level);
        return sanctionMapper.toResponse(sanctionRepository.save(sanction));
    }

    /**
     * Confirma una sanción de daño sugerida. Sin {@code days} usa la duración de la política para el nivel (con
     * reincidencia); con {@code level} cambia el nivel registrado. Un daño extremo es falta grave y puede terminar en
     * baneo. Lanza BusinessException si no está SUGGESTED.
     */
    @Transactional
    public SanctionResponse confirm(Long id, Integer days, DamageLevel level) {
        Sanction sanction = getSanction(id);
        requireSuggested(sanction, "confirmar");
        if (level != null) {
            sanction.setDamageLevel(level);
        }
        DamageLevel effective = sanction.getDamageLevel() == null ? DamageLevel.MODERATE : sanction.getDamageLevel();
        sanction.setDamageLevel(effective);
        int finalDays = days != null ? days : SanctionRules.daysWithRecidivism(SanctionRules.damageDays(effective),
                previousSanctions(sanction.getUser().getId()));
        activate(sanction, finalDays);
        banIfTooManyGraveFaults(sanction);
        log.info("Sanción {} confirmada por {} días (nivel {})", id, finalDays, effective);
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

    /**
     * Levanta una sanción ACTIVE: termina ahora mismo y deja de contar para reincidencia y faltas graves. Si la
     * sanción causó un baneo, se reactiva al usuario. Lanza BusinessException si no está ACTIVE.
     */
    @Transactional
    public SanctionResponse lift(Long id, String reason) {
        finishExpiredSanctions();
        Sanction sanction = getSanction(id);
        requireActive(sanction, "levantar");
        sanction.setStatus(SanctionStatus.LIFTED);
        sanction.setEndAt(Instant.now(clock));
        sanction.setAdminNote(reason);
        if (sanction.isCausedBan()) {
            userService.setActive(sanction.getUser().getId(), true, null);
        }
        log.info("Sanción {} levantada", id);
        return sanctionMapper.toResponse(sanction);
    }

    /**
     * Reduce una sanción ACTIVE a una duración total menor (en días desde su inicio). Lanza BusinessException si no
     * está ACTIVE, si causó un baneo (esas solo se levantan), si no es menor que la actual o si la nueva duración ya
     * transcurrió (en ese caso corresponde levantarla).
     */
    @Transactional
    public SanctionResponse reduce(Long id, int days, String reason) {
        finishExpiredSanctions();
        Sanction sanction = getSanction(id);
        requireActive(sanction, "reducir");
        if (sanction.isCausedBan()) {
            throw new BusinessException("Una sanción que causó un baneo solo se puede levantar");
        }
        Instant newEnd = sanction.getStartAt().plus(days, ChronoUnit.DAYS);
        if (!newEnd.isBefore(sanction.getEndAt())) {
            throw new BusinessException("La nueva duración debe ser menor que la actual");
        }
        if (!newEnd.isAfter(Instant.now(clock))) {
            throw new BusinessException("Esa duración ya transcurrió: use Levantar sanción");
        }
        sanction.setEndAt(newEnd);
        sanction.setAdminNote(reason);
        log.info("Sanción {} reducida a {} días", id, days);
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

    private Sanction newSanction(Long userId, SanctionType type) {
        userService.findById(userId);
        Sanction sanction = new Sanction();
        sanction.setUser(entityManager.getReference(User.class, userId));
        sanction.setType(type);
        return sanction;
    }

    /** Sanciones recientes del usuario que cuentan para la reincidencia (ACTIVE o FINISHED en la ventana). */
    private long previousSanctions(Long userId) {
        Instant since = Instant.now(clock).minus(SanctionRules.RECIDIVISM_WINDOW_DAYS, ChronoUnit.DAYS);
        return sanctionRepository.countStartedSince(userId, COUNTED_STATUSES, since);
    }

    /** Si el usuario supera el máximo de faltas graves, esta sanción pasa a ser un baneo y se desactiva al usuario. */
    private void banIfTooManyGraveFaults(Sanction sanction) {
        boolean grave = sanction.getType() == SanctionType.LOSS
                || (sanction.getType() == SanctionType.DAMAGE && sanction.getDamageLevel() == DamageLevel.SEVERE);
        if (!grave) {
            return;
        }
        Long userId = sanction.getUser().getId();
        long graveFaults = sanctionRepository.countGraveFaults(userId, COUNTED_STATUSES, SanctionType.LOSS,
                SanctionType.DAMAGE, DamageLevel.SEVERE);
        if (graveFaults > SanctionRules.MAX_GRAVE_FAULTS) {
            sanction.setCausedBan(true);
            sanction.setReason(sanction.getReason() + " — BANEO: " + graveFaults + " faltas graves (máximo "
                    + SanctionRules.MAX_GRAVE_FAULTS + ")");
            activate(sanction, SanctionRules.BAN_DAYS);
            userService.setActive(userId, false, null);
            log.warn("Usuario {} baneado por {} faltas graves", userId, graveFaults);
        }
    }

    private void requireActive(Sanction sanction, String action) {
        if (sanction.getStatus() != SanctionStatus.ACTIVE) {
            throw new BusinessException("Solo se puede " + action + " una sanción activa");
        }
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
