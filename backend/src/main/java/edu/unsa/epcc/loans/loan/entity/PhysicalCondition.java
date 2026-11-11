package edu.unsa.epcc.loans.loan.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Estado físico de un ítem al entregarlo y al devolverlo (RF-07), ordenado de mejor a peor. */
@Getter
@RequiredArgsConstructor
public enum PhysicalCondition {
    GOOD("Bueno"),
    FAIR("Regular"),
    DAMAGED("Dañado");

    /** Nombre en español para mensajes al usuario. */
    private final String label;

    /** Indica si este estado es peor que el otro (por ejemplo, GOOD → DAMAGED). */
    public boolean isWorseThan(PhysicalCondition other) {
        return ordinal() > other.ordinal();
    }
}
