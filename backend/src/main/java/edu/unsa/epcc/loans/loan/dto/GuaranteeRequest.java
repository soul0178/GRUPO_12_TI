package edu.unsa.epcc.loans.loan.dto;

import edu.unsa.epcc.loans.loan.entity.GuaranteeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GuaranteeRequest(
        @NotNull(message = "El tipo de garantía es obligatorio") GuaranteeType type,
        @NotBlank(message = "La descripción de la garantía es obligatoria")
        @Size(max = 255, message = "La descripción de la garantía es muy larga")
        String description) {
}
