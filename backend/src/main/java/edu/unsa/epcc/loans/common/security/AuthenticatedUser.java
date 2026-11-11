package edu.unsa.epcc.loans.common.security;

/** Usuario autenticado de la petición actual, reconstruido a partir del token JWT (sin consultar la base). */
public record AuthenticatedUser(Long id, String email, String role) {
}
