package edu.unsa.epcc.loans.sanction.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Nueva duración total (en días desde el inicio) y motivo con los que un ADMIN reduce una sanción activa. */
public record ReduceSanctionRequest(
        @NotNull(message = "Los días de suspensión son obligatorios")
        @Min(value = 1, message = "La suspensión debe ser de al menos 1 día")
        @Max(value = 365, message = "La suspensión no puede superar 365 días")
        Integer days,
        @NotBlank(message = "El motivo es obligatorio")
        @Size(max = 500, message = "El motivo es muy largo")
        String reason) {
}
