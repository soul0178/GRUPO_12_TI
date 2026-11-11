package edu.unsa.epcc.loans.user.dto;

import edu.unsa.epcc.loans.user.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Datos que un ADMIN puede editar de un usuario (la contraseña y el estado activo tienen su propia operación). */
public record UpdateUserRequest(
        @NotBlank(message = "Los nombres son obligatorios") @Size(max = 100, message = "Los nombres son muy largos")
        String firstName,
        @NotBlank(message = "Los apellidos son obligatorios") @Size(max = 100, message = "Los apellidos son muy largos")
        String lastName,
        @NotBlank(message = "El correo es obligatorio") @Email(message = "El correo no es válido")
        @Size(max = 150, message = "El correo es muy largo")
        String email,
        @NotBlank(message = "El código o DNI es obligatorio") @Size(max = 20, message = "El código o DNI es muy largo")
        String documentNumber,
        @Size(max = 20, message = "El teléfono es muy largo") String phone,
        @NotNull(message = "El rol es obligatorio") Role role) {
}
