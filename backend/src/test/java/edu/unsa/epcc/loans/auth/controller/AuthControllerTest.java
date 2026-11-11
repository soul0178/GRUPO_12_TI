package edu.unsa.epcc.loans.auth.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de login: token, credenciales incorrectas, usuario desactivado, validaciones y token inválido. */
class AuthControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;

    private String loginBody(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    @Test
    void shouldReturnTokenAndUserWhenCredentialsAreCorrect() throws Exception {
        User user = users.create(Role.MANAGER);

        mockMvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content(loginBody(user.getEmail(), TestUserFactory.PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("MANAGER"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    void shouldReturn401InSpanishWhenPasswordIsWrong() throws Exception {
        User user = users.create(Role.STUDENT);

        mockMvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content(loginBody(user.getEmail(), "incorrecta")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Correo o contraseña incorrectos"));
    }

    @Test
    void shouldReturn403WhenUserIsDeactivated() throws Exception {
        User user = users.createInactive(Role.STUDENT);

        mockMvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content(loginBody(user.getEmail(), TestUserFactory.PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Su usuario está desactivado"));
    }

    @Test
    void shouldReturn400WhenLoginFieldsAreMissing() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn401WhenTokenIsInvalid() throws Exception {
        mockMvc.perform(get("/api/me").header("Authorization", "Bearer token.invalido.xyz"))
                .andExpect(status().isUnauthorized());
    }
}
