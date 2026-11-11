package edu.unsa.epcc.loans.user.dto;

import edu.unsa.epcc.loans.user.entity.Role;

/** Datos mínimos de un usuario para que el personal lo busque y lo seleccione (por ejemplo, al entregar un ítem). */
public record UserSummaryResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String documentNumber,
        Role role,
        boolean active) {
}
