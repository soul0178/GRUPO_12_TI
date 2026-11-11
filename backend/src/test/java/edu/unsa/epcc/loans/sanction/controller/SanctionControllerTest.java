package edu.unsa.epcc.loans.sanction.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.unsa.epcc.loans.sanction.dto.SanctionResponse;
import edu.unsa.epcc.loans.sanction.service.SanctionService;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestLoanFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de sanciones: lectura para el personal, confirmación solo ADMIN y "mis sanciones" para cualquiera. */
class SanctionControllerTest extends IntegrationTestBase {


    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestLoanFactory loans;
    @Autowired
    private SanctionService sanctionService;

    private String bearer(Role role) {
        return users.bearerFor(users.create(role));
    }

    private SanctionResponse suggestedFor(User user) {
        return sanctionService.suggestDamageSanction(user.getId(), loanId(), "Equipo dañado");
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MANAGER", "ADMIN"})
    void shouldListSanctionsWhenRoleIsStaff(Role role) throws Exception {
        suggestedFor(users.create(Role.STUDENT));

        mockMvc.perform(get("/api/sanctions").param("status", "SUGGESTED").header("Authorization", bearer(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("SUGGESTED"))
                .andExpect(jsonPath("$.content[0].userEmail").isNotEmpty());
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"STUDENT", "TEACHER", "ADMINISTRATIVE"})
    void shouldReturn403WhenBorrowerListsAllSanctions(Role role) throws Exception {
        mockMvc.perform(get("/api/sanctions").header("Authorization", bearer(role)))
                .andExpect(status().isForbidden());
    }

    /** Id de un préstamo real, porque sanctions.loan_id tiene clave foránea. */
    private long loanId() {
        return loans.create(users.create(Role.STUDENT)).getId();
    }

    @Test
    void shouldReturn401WhenListingSanctionsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/sanctions")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldConfirmSuggestedSanctionWhenAdmin() throws Exception {
        SanctionResponse suggested = suggestedFor(users.create(Role.STUDENT));

        mockMvc.perform(post("/api/sanctions/" + suggested.id() + "/confirm")
                        .header("Authorization", bearer(Role.ADMIN)).contentType(APPLICATION_JSON)
                        .content("{\"days\":7}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.endAt").isNotEmpty());
    }

    @Test
    void shouldRejectSuggestedSanctionWhenAdmin() throws Exception {
        SanctionResponse suggested = suggestedFor(users.create(Role.STUDENT));

        mockMvc.perform(post("/api/sanctions/" + suggested.id() + "/reject")
                        .header("Authorization", bearer(Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = "ADMIN", mode = EnumSource.Mode.EXCLUDE)
    void shouldReturn403WhenNonAdminConfirmsOrRejects(Role role) throws Exception {
        SanctionResponse suggested = suggestedFor(users.create(Role.STUDENT));
        String bearer = bearer(role);

        mockMvc.perform(post("/api/sanctions/" + suggested.id() + "/confirm").header("Authorization", bearer)
                        .contentType(APPLICATION_JSON).content("{\"days\":3}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/sanctions/" + suggested.id() + "/reject").header("Authorization", bearer))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn400WhenConfirmDaysAreInvalid() throws Exception {
        SanctionResponse suggested = suggestedFor(users.create(Role.STUDENT));

        mockMvc.perform(post("/api/sanctions/" + suggested.id() + "/confirm")
                        .header("Authorization", bearer(Role.ADMIN)).contentType(APPLICATION_JSON)
                        .content("{\"days\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn409WhenConfirmingTwice() throws Exception {
        SanctionResponse suggested = suggestedFor(users.create(Role.STUDENT));
        String bearer = bearer(Role.ADMIN);
        mockMvc.perform(post("/api/sanctions/" + suggested.id() + "/confirm").header("Authorization", bearer)
                .contentType(APPLICATION_JSON).content("{\"days\":2}"));

        mockMvc.perform(post("/api/sanctions/" + suggested.id() + "/confirm").header("Authorization", bearer)
                        .contentType(APPLICATION_JSON).content("{\"days\":2}"))
                .andExpect(status().isConflict());
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldShowOnlyOwnSanctionsInMySanctions(Role role) throws Exception {
        User user = users.create(role);
        sanctionService.createOverdueSanction(user.getId(), loanId(), Duration.ofHours(3));
        sanctionService.createOverdueSanction(users.create(Role.STUDENT).getId(), loanId(), Duration.ofHours(3));

        mockMvc.perform(get("/api/me/sanctions").param("status", "ACTIVE")
                        .header("Authorization", users.bearerFor(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].userId").value(user.getId()));
    }
}
