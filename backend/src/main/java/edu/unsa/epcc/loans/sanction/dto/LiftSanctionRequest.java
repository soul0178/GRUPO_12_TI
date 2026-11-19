package edu.unsa.epcc.loans.sanction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Motivo con el que un ADMIN levanta una sanción activa. */
public record LiftSanctionRequest(
        @NotBlank(message = "El motivo es obligatorio")
        @Size(max = 500, message = "El motivo es muy largo")
        String reason) {
}
