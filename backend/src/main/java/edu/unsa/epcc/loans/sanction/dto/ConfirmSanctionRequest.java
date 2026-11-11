package edu.unsa.epcc.loans.sanction.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Días de suspensión con los que el ADMIN confirma una sanción sugerida. */
public record ConfirmSanctionRequest(
        @NotNull(message = "Los días de suspensión son obligatorios")
        @Min(value = 1, message = "La suspensión debe ser de al menos 1 día")
        @Max(value = 365, message = "La suspensión no puede superar 365 días")
        Integer days) {
}
