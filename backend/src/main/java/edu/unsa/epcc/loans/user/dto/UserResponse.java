package edu.unsa.epcc.loans.user.dto;

import edu.unsa.epcc.loans.user.entity.Role;
import java.time.Instant;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String documentNumber,
        String phone,
        Role role,
        boolean active,
        Instant createdAt) {
}
