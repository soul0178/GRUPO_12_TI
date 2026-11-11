package edu.unsa.epcc.loans.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateItemRequest(
        @NotBlank(message = "El código de inventario es obligatorio")
        @Size(max = 50, message = "El código de inventario es muy largo")
        String code,
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 150, message = "El nombre es muy largo")
        String name,
        @Size(max = 1000, message = "La descripción es muy larga") String description,
        @NotNull(message = "La categoría es obligatoria") Long categoryId) {
}
