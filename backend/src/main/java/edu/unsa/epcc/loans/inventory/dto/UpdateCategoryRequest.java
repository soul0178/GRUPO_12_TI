package edu.unsa.epcc.loans.inventory.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Política que un ADMIN puede editar de una categoría. */
public record UpdateCategoryRequest(
        @NotNull(message = "El plazo máximo es obligatorio")
        @Min(value = 1, message = "El plazo máximo debe ser de al menos 1 hora")
        @Max(value = 720, message = "El plazo máximo no puede superar 720 horas (30 días)")
        Integer maxLoanHours,
        @NotNull(message = "Debe indicar si la categoría requiere garantía") Boolean requiresGuarantee) {
}
