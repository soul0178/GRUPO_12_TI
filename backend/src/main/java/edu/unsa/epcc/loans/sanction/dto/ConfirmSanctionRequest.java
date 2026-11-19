package edu.unsa.epcc.loans.sanction.dto;

import edu.unsa.epcc.loans.sanction.entity.DamageLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Datos con los que el ADMIN confirma una sanción de daño sugerida. Sin días se usa la duración de la política
 * según el nivel (con reincidencia); sin nivel se mantiene el que registró el personal al recibir el ítem.
 */
public record ConfirmSanctionRequest(
        @Min(value = 1, message = "La suspensión debe ser de al menos 1 día")
        @Max(value = 365, message = "La suspensión no puede superar 365 días")
        Integer days,
        DamageLevel damageLevel) {
}
