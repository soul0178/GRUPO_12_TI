package edu.unsa.epcc.loans.user.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de /users: solo ADMIN (403 para el resto), validaciones y activación. */
class UserControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;

    private String createBody(String email, String document) {
        return """
                {"firstName":"Ana","lastName":"Pérez","email":"%s","documentNumber":"%s",
                 "password":"Password123","role":"STUDENT"}""".formatted(email, document);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = "ADMIN", mode = EnumSource.Mode.EXCLUDE)
    void shouldReturn403ForUsersListWhenRoleIsNotAdmin(Role role) throws Exception {
        String bearer = users.bearerFor(users.create(role));

        mockMvc.perform(get("/api/users").header("Authorization", bearer))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("No tiene permiso para realizar esta acción"));
    }

    @Test
    void shouldReturn401WhenListingUsersWithoutToken() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn403WhenNonAdminTriesToCreateUser() throws Exception {
        String bearer = users.bearerFor(users.create(Role.MANAGER));

        mockMvc.perform(post("/api/users").header("Authorization", bearer).contentType(APPLICATION_JSON)
                        .content(createBody("x@epcc.unsa.edu.pe", "1")))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldCreateUserAndLetThemLoginWhenAdminCreatesIt() throws Exception {
        String bearer = users.bearerFor(users.create(Role.ADMIN));
        String id = UUID.randomUUID().toString().substring(0, 8);
        String email = "nuevo." + id + "@epcc.unsa.edu.pe";

        mockMvc.perform(post("/api/users").header("Authorization", bearer).contentType(APPLICATION_JSON)
                        .content(createBody(email, id)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.active").value(true));

        mockMvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Password123\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn409WhenCreatingUserWithExistingEmail() throws Exception {
        String bearer = users.bearerFor(users.create(Role.ADMIN));
        User existing = users.create(Role.STUDENT);

        mockMvc.perform(post("/api/users").header("Authorization", bearer).contentType(APPLICATION_JSON)
                        .content(createBody(existing.getEmail(), "otro-" + existing.getDocumentNumber())))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn400WhenCreateUserDataIsInvalid() throws Exception {
        String bearer = users.bearerFor(users.create(Role.ADMIN));

        mockMvc.perform(post("/api/users").header("Authorization", bearer).contentType(APPLICATION_JSON)
                        .content("""
                                {"firstName":"","lastName":"X","email":"no-es-correo","documentNumber":"1",
                                 "password":"corta","role":"STUDENT"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn404WhenUserDoesNotExist() throws Exception {
        String bearer = users.bearerFor(users.create(Role.ADMIN));

        mockMvc.perform(get("/api/users/-1").header("Authorization", bearer))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldDeactivateUserAndBlockTheirLogin() throws Exception {
        String bearer = users.bearerFor(users.create(Role.ADMIN));
        User user = users.create(Role.STUDENT);

        mockMvc.perform(post("/api/users/" + user.getId() + "/deactivate").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + user.getEmail() + "\",\"password\":\"Password123\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn409WhenAdminDeactivatesThemselves() throws Exception {
        User admin = users.create(Role.ADMIN);

        mockMvc.perform(post("/api/users/" + admin.getId() + "/deactivate")
                        .header("Authorization", users.bearerFor(admin)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldUpdateUserRoleWhenAdminEditsIt() throws Exception {
        String bearer = users.bearerFor(users.create(Role.ADMIN));
        User user = users.create(Role.STUDENT);

        mockMvc.perform(put("/api/users/" + user.getId()).header("Authorization", bearer)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"firstName":"A","lastName":"B","email":"%s","documentNumber":"%s","role":"TEACHER"}"""
                                .formatted(user.getEmail(), user.getDocumentNumber())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("TEACHER"));
    }
}
