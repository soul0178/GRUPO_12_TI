package edu.unsa.epcc.loans.loan.dto;

import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Datos de la entrega. La garantía es obligatoria solo si la categoría del ítem la exige. */
public record CreateLoanRequest(
        @NotNull(message = "El usuario es obligatorio") Long userId,
        @NotNull(message = "El ítem es obligatorio") Long itemId,
        @NotNull(message = "El estado físico es obligatorio") PhysicalCondition deliveryCondition,
        @Size(max = 500, message = "Las observaciones son muy largas") String deliveryObservations,
        @Valid GuaranteeRequest guarantee) {
}
