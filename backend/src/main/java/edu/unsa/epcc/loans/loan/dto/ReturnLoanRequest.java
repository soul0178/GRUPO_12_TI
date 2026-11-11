package edu.unsa.epcc.loans.loan.dto;

import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReturnLoanRequest(
        @NotNull(message = "El estado físico es obligatorio") PhysicalCondition returnCondition,
        @Size(max = 500, message = "Las observaciones son muy largas") String returnObservations) {
}
