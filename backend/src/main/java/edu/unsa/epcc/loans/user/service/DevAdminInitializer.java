package edu.unsa.epcc.loans.user.service;

import edu.unsa.epcc.loans.user.dto.CreateUserRequest;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Solo en el perfil dev: crea al arrancar un ADMIN de pruebas si no existe, para poder entrar al sistema. */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevAdminInitializer implements CommandLineRunner {

    private final UserService userService;
    private final UserRepository userRepository;

    @Value("${app.dev-admin.email}")
    private String email;

    @Value("${app.dev-admin.password}")
    private String password;

    @Value("${app.dev-admin.document-number}")
    private String documentNumber;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        userService.create(new CreateUserRequest("Administrador", "EPCC", email, documentNumber, null, password,
                Role.ADMIN));
        log.warn("Se creó el administrador de desarrollo {}", email);
    }
}
