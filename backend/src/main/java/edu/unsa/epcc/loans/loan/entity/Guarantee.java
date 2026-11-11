package edu.unsa.epcc.loans.loan.entity;

import edu.unsa.epcc.loans.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Documento que el usuario deja mientras tiene el ítem; se marca como devuelto al devolver el ítem (RF-07). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "guarantees")
public class Guarantee extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GuaranteeType type;

    /** Texto libre que identifica la garantía (por ejemplo, el número del documento). */
    @Column(nullable = false)
    private String description;

    /** Es true cuando el documento ya se le devolvió al usuario. */
    @Column(nullable = false)
    private boolean returned;
}
