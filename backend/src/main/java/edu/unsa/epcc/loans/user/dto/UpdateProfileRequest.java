package edu.unsa.epcc.loans.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Datos de contacto que el propio usuario puede editar en su perfil (RF-02). */
public record UpdateProfileRequest(
        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 100, message = "Los nombres son muy largos")
        String firstName,
        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 100, message = "Los apellidos son muy largos")
        String lastName,
        @Size(max = 20, message = "El teléfono es muy largo") String phone) {
}
