package edu.unsa.epcc.loans.user.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.dto.ChangePasswordRequest;
import edu.unsa.epcc.loans.user.dto.CreateUserRequest;
import edu.unsa.epcc.loans.user.dto.UpdateUserRequest;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import edu.unsa.epcc.loans.user.repository.UserRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;

/** Reglas de negocio de usuarios (RF-01 y RF-02) contra PostgreSQL real. */
class UserServiceTest extends IntegrationTestBase {

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private CreateUserRequest newRequest(String email, String document) {
        return new CreateUserRequest("Ana", "Pérez", email, document, null, "Password123", Role.STUDENT);
    }

    private String unique() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    @Test
    void shouldStorePasswordAsBcryptHashAndNormalizeEmail() {
        String id = unique();

        UserResponse created = userService.create(newRequest("  Ana." + id + "@EPCC.unsa.edu.pe ", id));

        User saved = userRepository.findById(created.id()).orElseThrow();
        assertThat(saved.getEmail()).isEqualTo("ana." + id + "@epcc.unsa.edu.pe");
        assertThat(saved.getPasswordHash()).isNotEqualTo("Password123").startsWith("$2");
        assertThat(saved.isActive()).isTrue();
    }

    @Test
    void shouldRejectUserWhenEmailAlreadyExists() {
        User existing = users.create(Role.STUDENT);

        assertThatThrownBy(() -> userService.create(newRequest(existing.getEmail(), unique())))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("correo");
    }

    @Test
    void shouldRejectUserWhenDocumentNumberAlreadyExists() {
        User existing = users.create(Role.STUDENT);

        assertThatThrownBy(() -> userService.create(newRequest(unique() + "@epcc.unsa.edu.pe",
                existing.getDocumentNumber())))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("código o DNI");
    }

    @Test
    void shouldRejectUpdateWhenEmailBelongsToAnotherUser() {
        User first = users.create(Role.STUDENT);
        User second = users.create(Role.TEACHER);
        UpdateUserRequest request = new UpdateUserRequest("A", "B", first.getEmail(), second.getDocumentNumber(),
                null, Role.TEACHER);

        assertThatThrownBy(() -> userService.update(second.getId(), request))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldAllowUpdateKeepingOwnEmailAndChangingRole() {
        User user = users.create(Role.STUDENT);
        UpdateUserRequest request = new UpdateUserRequest("Nuevo", "Nombre", user.getEmail(),
                user.getDocumentNumber(), "999", Role.MANAGER);

        UserResponse updated = userService.update(user.getId(), request);

        assertThat(updated.role()).isEqualTo(Role.MANAGER);
        assertThat(updated.firstName()).isEqualTo("Nuevo");
    }

    @Test
    void shouldAuthenticateWithCorrectCredentials() {
        User user = users.create(Role.STUDENT);

        UserResponse result = userService.authenticate(user.getEmail().toUpperCase(), TestUserFactory.PASSWORD);

        assertThat(result.id()).isEqualTo(user.getId());
    }

    @Test
    void shouldRejectLoginWithWrongPassword() {
        User user = users.create(Role.STUDENT);

        assertThatThrownBy(() -> userService.authenticate(user.getEmail(), "otra-clave"))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void shouldRejectLoginWhenUserIsDeactivated() {
        User user = users.createInactive(Role.STUDENT);

        assertThatThrownBy(() -> userService.authenticate(user.getEmail(), TestUserFactory.PASSWORD))
                .isInstanceOf(DisabledException.class);
    }

    @Test
    void shouldRejectDeactivatingYourOwnUser() {
        User admin = users.create(Role.ADMIN);

        assertThatThrownBy(() -> userService.setActive(admin.getId(), false, admin.getId()))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void shouldDeactivateAndReactivateAnotherUser() {
        User admin = users.create(Role.ADMIN);
        User user = users.create(Role.STUDENT);

        assertThat(userService.setActive(user.getId(), false, admin.getId()).active()).isFalse();
        assertThat(userService.setActive(user.getId(), true, admin.getId()).active()).isTrue();
    }

    @Test
    void shouldChangePasswordWhenCurrentPasswordMatches() {
        User user = users.create(Role.STUDENT);

        userService.changePassword(user.getId(), new ChangePasswordRequest(TestUserFactory.PASSWORD, "NuevaClave99"));

        User saved = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("NuevaClave99", saved.getPasswordHash())).isTrue();
    }

    @Test
    void shouldRejectPasswordChangeWhenCurrentPasswordIsWrong() {
        User user = users.create(Role.STUDENT);

        assertThatThrownBy(() -> userService.changePassword(user.getId(),
                new ChangePasswordRequest("incorrecta", "NuevaClave99")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("contraseña actual");
    }

    @Test
    void shouldFailWhenUserDoesNotExist() {
        assertThatThrownBy(() -> userService.findById(-1L)).isInstanceOf(NotFoundException.class);
    }
}
