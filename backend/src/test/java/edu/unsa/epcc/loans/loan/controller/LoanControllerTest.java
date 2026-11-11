package edu.unsa.epcc.loans.loan.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestItemFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de /loans: solo personal, validaciones (400) y conflictos de negocio (409). */
class LoanControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;

    private String body(User user, Item item, String guarantee) {
        return """
                {"userId": %d, "itemId": %d, "deliveryCondition": "GOOD"%s}
                """.formatted(user.getId(), item.getId(), guarantee == null ? "" : ", \"guarantee\": " + guarantee);
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MANAGER", "ADMIN"})
    void shouldDeliverAndReturnWhenStaff(Role role) throws Exception {
        String token = users.bearerFor(users.create(role));
        User borrower = users.create(Role.STUDENT);
        Item book = items.create("Libro", ItemStatus.AVAILABLE);

        String response = mockMvc.perform(post("/api/loans").header("Authorization", token)
                        .contentType(APPLICATION_JSON).content(body(borrower, book, null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.itemCode").value(book.getCode()))
                .andReturn().getResponse().getContentAsString();
        String id = response.replaceAll(".*\"id\":(\\d+).*", "$1");

        mockMvc.perform(post("/api/loans/" + id + "/return").header("Authorization", token)
                        .contentType(APPLICATION_JSON).content("{\"returnCondition\": \"GOOD\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"));
        mockMvc.perform(get("/api/loans/" + id).header("Authorization", token))
                .andExpect(status().isOk());
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"STUDENT", "TEACHER", "ADMINISTRATIVE"})
    void shouldReturn403ForBorrowers(Role role) throws Exception {
        String token = users.bearerFor(users.create(role));
        User borrower = users.create(Role.STUDENT);
        Item book = items.create("Libro", ItemStatus.AVAILABLE);

        mockMvc.perform(post("/api/loans").header("Authorization", token)
                        .contentType(APPLICATION_JSON).content(body(borrower, book, null)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/loans/1/return").header("Authorization", token)
                        .contentType(APPLICATION_JSON).content("{\"returnCondition\": \"GOOD\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/loans").header("Authorization", token)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/loans/1").header("Authorization", token)).andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/loans")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn400WhenRequiredFieldsAreMissing() throws Exception {
        String token = users.bearerFor(users.create(Role.MANAGER));

        mockMvc.perform(post("/api/loans").header("Authorization", token)
                        .contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
        mockMvc.perform(post("/api/loans/1/return").header("Authorization", token)
                        .contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenGuaranteeHasNoDescription() throws Exception {
        String token = users.bearerFor(users.create(Role.MANAGER));
        User borrower = users.create(Role.STUDENT);
        Item equipment = items.create("Equipo", ItemStatus.AVAILABLE);

        mockMvc.perform(post("/api/loans").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content(body(borrower, equipment, "{\"type\": \"DNI\", \"description\": \"\"}")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn409WhenEquipmentHasNoGuarantee() throws Exception {
        String token = users.bearerFor(users.create(Role.MANAGER));

        mockMvc.perform(post("/api/loans").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content(body(users.create(Role.STUDENT), items.create("Equipo", ItemStatus.AVAILABLE), null)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn409WhenItemIsAlreadyOnLoan() throws Exception {
        String token = users.bearerFor(users.create(Role.MANAGER));

        mockMvc.perform(post("/api/loans").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content(body(users.create(Role.STUDENT), items.create("Libro", ItemStatus.ON_LOAN), null)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn404ForUnknownLoan() throws Exception {
        String token = users.bearerFor(users.create(Role.MANAGER));

        mockMvc.perform(get("/api/loans/-1").header("Authorization", token)).andExpect(status().isNotFound());
    }

    @Test
    void shouldListLoansFilteredByStatus() throws Exception {
        String token = users.bearerFor(users.create(Role.ADMIN));

        mockMvc.perform(get("/api/loans?status=OVERDUE").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void shouldLookupUsersOnlyForStaff() throws Exception {
        User target = users.create(Role.STUDENT);
        String email = target.getEmail();

        mockMvc.perform(get("/api/users/lookup").param("text", email)
                        .header("Authorization", users.bearerFor(users.create(Role.MANAGER))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value(email))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
        mockMvc.perform(get("/api/users/lookup").param("text", email)
                        .header("Authorization", users.bearerFor(users.create(Role.STUDENT))))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/users/lookup").param("text", " ")
                        .header("Authorization", users.bearerFor(users.create(Role.ADMIN))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}
