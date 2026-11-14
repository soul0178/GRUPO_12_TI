package edu.unsa.epcc.loans.report.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.loan.entity.PhysicalCondition;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestItemFactory;
import edu.unsa.epcc.loans.support.TestLoanFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import edu.unsa.epcc.loans.user.entity.User;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de /reports: solo personal, formato de la respuesta, filtros y errores. */
class ReportControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;
    @Autowired
    private TestLoanFactory loans;

    private User borrowerWithHistory(Item item) {
        User borrower = users.create(Role.STUDENT);
        Instant start = Instant.now().minus(Duration.ofDays(3));
        loans.create(borrower, item, start, start.plus(Duration.ofHours(4)), start.plus(Duration.ofHours(6)),
                PhysicalCondition.DAMAGED);
        Instant recent = Instant.now().minus(Duration.ofHours(1));
        loans.create(borrower, items.create("Libro", ItemStatus.AVAILABLE), recent, recent.plus(Duration.ofHours(4)),
                null, null);
        return borrower;
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MANAGER", "ADMIN"})
    void shouldReturnUserHistoryWhenStaff(Role role) throws Exception {
        String token = users.bearerFor(users.create(role));
        User borrower = borrowerWithHistory(items.create("Libro", ItemStatus.AVAILABLE));

        mockMvc.perform(get("/api/reports/users/" + borrower.getId() + "/loans").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject.id").value(borrower.getId()))
                .andExpect(jsonPath("$.summary.total").value(2))
                .andExpect(jsonPath("$.summary.active").value(1))
                .andExpect(jsonPath("$.summary.returned").value(1))
                .andExpect(jsonPath("$.summary.returnedLate").value(1))
                .andExpect(jsonPath("$.summary.returnedDamaged").value(1))
                .andExpect(jsonPath("$.loans.totalElements").value(2))
                .andExpect(jsonPath("$.loans.content[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$.generatedAt").exists());
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MANAGER", "ADMIN"})
    void shouldReturnItemHistoryWhenStaff(Role role) throws Exception {
        String token = users.bearerFor(users.create(role));
        Item item = items.create("Libro", ItemStatus.AVAILABLE);
        borrowerWithHistory(item);

        mockMvc.perform(get("/api/reports/items/" + item.getId() + "/loans").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subject.id").value(item.getId()))
                .andExpect(jsonPath("$.summary.total").value(1))
                .andExpect(jsonPath("$.loans.content[0].itemCode").value(item.getCode()));
    }

    @Test
    void shouldFilterByStatusAndDates() throws Exception {
        String token = users.bearerFor(users.create(Role.MANAGER));
        User borrower = borrowerWithHistory(items.create("Libro", ItemStatus.AVAILABLE));

        mockMvc.perform(get("/api/reports/users/" + borrower.getId() + "/loans").param("status", "RETURNED")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loans.totalElements").value(1))
                .andExpect(jsonPath("$.summary.total").value(2));
        mockMvc.perform(get("/api/reports/users/" + borrower.getId() + "/loans").param("from", "2000-01-01")
                        .param("to", "2000-12-31").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.total").value(0))
                .andExpect(jsonPath("$.loans.content").isEmpty());
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"STUDENT", "TEACHER", "ADMINISTRATIVE"})
    void shouldReturn403ForBorrowers(Role role) throws Exception {
        String token = users.bearerFor(users.create(role));

        mockMvc.perform(get("/api/reports/users/1/loans").header("Authorization", token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/reports/items/1/loans").header("Authorization", token))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/reports/users/1/loans")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn404WhenUserOrItemDoesNotExist() throws Exception {
        String token = users.bearerFor(users.create(Role.ADMIN));

        mockMvc.perform(get("/api/reports/users/999999999/loans").header("Authorization", token))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/reports/items/999999999/loans").header("Authorization", token))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn409WhenRangeIsReversed() throws Exception {
        String token = users.bearerFor(users.create(Role.ADMIN));
        User borrower = users.create(Role.STUDENT);

        mockMvc.perform(get("/api/reports/users/" + borrower.getId() + "/loans").param("from", "2026-03-10")
                        .param("to", "2026-03-01").header("Authorization", token))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn400WhenParametersAreInvalid() throws Exception {
        String token = users.bearerFor(users.create(Role.ADMIN));
        User borrower = users.create(Role.STUDENT);

        mockMvc.perform(get("/api/reports/users/" + borrower.getId() + "/loans").param("from", "ayer")
                        .header("Authorization", token)).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/reports/users/" + borrower.getId() + "/loans").param("status", "NADA")
                        .header("Authorization", token)).andExpect(status().isBadRequest());
    }
}
