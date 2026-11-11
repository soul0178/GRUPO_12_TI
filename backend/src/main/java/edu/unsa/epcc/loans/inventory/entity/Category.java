package edu.unsa.epcc.loans.inventory.entity;

import edu.unsa.epcc.loans.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Categoría de ítems (Equipo, Libro, Objeto) con su política de préstamo (RF-03). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "categories")
public class Category extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    /** Plazo máximo de préstamo en horas; también limita la duración de una reserva. */
    @Column(name = "max_loan_hours", nullable = false)
    private int maxLoanHours;

    /** Si es true, al entregar un ítem de esta categoría se debe registrar una garantía. */
    @Column(name = "requires_guarantee", nullable = false)
    private boolean requiresGuarantee;
}
