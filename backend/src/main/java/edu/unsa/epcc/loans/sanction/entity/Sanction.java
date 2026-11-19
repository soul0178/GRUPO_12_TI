package edu.unsa.epcc.loans.sanction.entity;

import edu.unsa.epcc.loans.common.entity.BaseEntity;
import edu.unsa.epcc.loans.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Suspensión temporal de un usuario para reservar y recibir préstamos (RF-08). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "sanctions")
public class Sanction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SanctionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SanctionStatus status;

    /** Inicio de la suspensión; vacío mientras la sanción solo está sugerida. */
    @Column(name = "start_at")
    private Instant startAt;

    /** Fin de la suspensión; al cumplirse, la sanción ACTIVE pasa a FINISHED. */
    @Column(name = "end_at")
    private Instant endAt;

    @Column(nullable = false)
    private String reason;

    /** Préstamo que originó la sanción (atraso, daño o pérdida); vacío si nació de una reserva. */
    @Column(name = "loan_id")
    private Long loanId;

    /** Reserva no recogida que originó la sanción (NO_SHOW); vacío si nació de un préstamo. */
    @Column(name = "reservation_id")
    private Long reservationId;

    /** Gravedad del daño; solo en sanciones DAMAGE. */
    @Enumerated(EnumType.STRING)
    @Column(name = "damage_level")
    private DamageLevel damageLevel;

    /** Verdadero si esta sanción llevó al baneo del usuario (tercera falta grave); al levantarla se reactiva. */
    @Column(name = "caused_ban", nullable = false)
    private boolean causedBan;

    /** Motivo que escribió el ADMIN al levantar o reducir la sanción. */
    @Column(name = "admin_note")
    private String adminNote;
}
