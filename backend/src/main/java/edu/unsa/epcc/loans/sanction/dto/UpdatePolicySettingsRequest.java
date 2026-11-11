package edu.unsa.epcc.loans.sanction.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdatePolicySettingsRequest(
        @NotNull(message = "El máximo de ítems activos es obligatorio")
        @Min(value = 1, message = "El máximo de ítems activos debe ser al menos 1")
        @Max(value = 20, message = "El máximo de ítems activos no puede superar 20")
        Integer maxActiveItems,
        @NotNull(message = "Los minutos de expiración son obligatorios")
        @Min(value = 1, message = "Los minutos de expiración deben ser al menos 1")
        @Max(value = 1440, message = "Los minutos de expiración no pueden superar 1440 (24 horas)")
        Integer reservationExpirationMinutes) {
}
