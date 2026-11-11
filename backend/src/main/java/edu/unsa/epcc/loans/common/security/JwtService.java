package edu.unsa.epcc.loans.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Genera y valida los tokens JWT de sesión (firmados con HMAC-SHA). */
@Service
public class JwtService {

    private static final String ROLE_CLAIM = "role";
    private static final String EMAIL_CLAIM = "email";

    private final SecretKey key;
    private final Duration expiration;
    private final Clock clock;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-minutes}") long expirationMinutes,
                      Clock clock) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = Duration.ofMinutes(expirationMinutes);
        this.clock = clock;
    }

    /** Crea un token con el id, correo y rol del usuario; vence según {@code app.jwt.expiration-minutes}. */
    public String generateToken(Long userId, String email, String role) {
        Instant now = Instant.now(clock);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(EMAIL_CLAIM, email)
                .claim(ROLE_CLAIM, role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(key)
                .compact();
    }

    /** Devuelve el usuario del token, o vacío si el token es inválido, está manipulado o venció. */
    public Optional<AuthenticatedUser> parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .clock(() -> Date.from(Instant.now(clock)))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(new AuthenticatedUser(Long.valueOf(claims.getSubject()),
                    claims.get(EMAIL_CLAIM, String.class), claims.get(ROLE_CLAIM, String.class)));
        } catch (JwtException | IllegalArgumentException exception) {
            return Optional.empty();
        }
    }
}
