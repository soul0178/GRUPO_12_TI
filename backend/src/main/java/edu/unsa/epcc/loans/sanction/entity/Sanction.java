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

    /** Id del préstamo que originó la sanción (el vínculo con la tabla de préstamos lo agrega M4). */
    @Column(name = "loan_id", nullable = false)
    private Long loanId;
}
