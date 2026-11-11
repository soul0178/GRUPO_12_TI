package edu.unsa.epcc.loans.support;

import edu.unsa.epcc.loans.common.security.JwtService;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import edu.unsa.epcc.loans.user.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Crea usuarios de prueba con datos únicos y devuelve su token, para que cada prueba prepare sus propios datos. */
@Component
@RequiredArgsConstructor
public class TestUserFactory {

    public static final String PASSWORD = "Password123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /** Crea y guarda un usuario activo con el rol indicado. */
    public User create(Role role) {
        String unique = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setFirstName("Nombre");
        user.setLastName("Apellido");
        user.setEmail("user-" + unique + "@epcc.unsa.edu.pe");
        user.setDocumentNumber(unique);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        user.setRole(role);
        return userRepository.save(user);
    }

    /** Crea un usuario inactivo. */
    public User createInactive(Role role) {
        User user = create(role);
        user.setActive(false);
        return userRepository.save(user);
    }

    /** Valor de la cabecera Authorization para el usuario dado. */
    public String bearerFor(User user) {
        return "Bearer " + jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
    }
}
