package edu.unsa.epcc.loans.loan.dto;

import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import edu.unsa.epcc.loans.sanction.entity.DamageLevel;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Datos de la devolución. Si vuelve dañado (DAMAGED) el personal indica el nivel del daño; con LOST el ítem se
 * registra como perdido.
 */
public record ReturnLoanRequest(
        @NotNull(message = "El estado físico es obligatorio") PhysicalCondition returnCondition,
        DamageLevel damageLevel,
        @Size(max = 500, message = "Las observaciones son muy largas") String returnObservations) {
}
