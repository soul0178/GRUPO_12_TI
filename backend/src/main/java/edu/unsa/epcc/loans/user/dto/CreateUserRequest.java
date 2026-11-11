package edu.unsa.epcc.loans.user.dto;

import edu.unsa.epcc.loans.user.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
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
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
        String password,
        @NotNull(message = "El rol es obligatorio") Role role) {
}
