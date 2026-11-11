package edu.unsa.epcc.loans.sanction.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de /settings: lectura para todos, edición solo ADMIN y validaciones. */
class PolicySettingsControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;

    private String bearer(Role role) {
        return users.bearerFor(users.create(role));
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldReturnSettingsForEveryRole(Role role) throws Exception {
        mockMvc.perform(get("/api/settings").header("Authorization", bearer(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxActiveItems").isNumber())
                .andExpect(jsonPath("$.reservationExpirationMinutes").isNumber());
    }

    @Test
    void shouldReturn401WhenReadingSettingsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/settings")).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = "ADMIN", mode = EnumSource.Mode.EXCLUDE)
    void shouldReturn403WhenNonAdminUpdatesSettings(Role role) throws Exception {
        mockMvc.perform(put("/api/settings").header("Authorization", bearer(role)).contentType(APPLICATION_JSON)
                        .content("{\"maxActiveItems\":4,\"reservationExpirationMinutes\":20}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn400WhenSettingsAreInvalid() throws Exception {
        mockMvc.perform(put("/api/settings").header("Authorization", bearer(Role.ADMIN))
                        .contentType(APPLICATION_JSON)
                        .content("{\"maxActiveItems\":0,\"reservationExpirationMinutes\":-5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }
}
