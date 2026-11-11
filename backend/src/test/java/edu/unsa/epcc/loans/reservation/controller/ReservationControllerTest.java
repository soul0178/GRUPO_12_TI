package edu.unsa.epcc.loans.reservation.controller;

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
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de reservas: cualquier rol reserva, solo el personal lista todas, validaciones (400) y conflictos (409). */
class ReservationControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;

    private String body(Item item, Instant start, Duration length) {
        return """
                {"itemId": %d, "startAt": "%s", "endAt": "%s"}
                """.formatted(item.getId(), start, start.plus(length));
    }

    private Instant soon() {
        return Instant.now().plus(Duration.ofHours(3));
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldCreateReservationForEveryRole(Role role) throws Exception {
        String token = users.bearerFor(users.create(role));
        Item item = items.create("Libro", ItemStatus.AVAILABLE);

        mockMvc.perform(post("/api/reservations").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content(body(item, soon(), Duration.ofHours(1))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.itemCode").value(item.getCode()));
    }

    @Test
    void shouldReturn401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/me/reservations")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/reservations").contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn400WhenFieldsAreMissing() throws Exception {
        String token = users.bearerFor(users.create(Role.STUDENT));

        mockMvc.perform(post("/api/reservations").header("Authorization", token).contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn409WhenRangeOverlapsAnotherReservation() throws Exception {
        Item item = items.create("Libro", ItemStatus.AVAILABLE);
        Instant start = soon();
        mockMvc.perform(post("/api/reservations").header("Authorization", users.bearerFor(users.create(Role.STUDENT)))
                        .contentType(APPLICATION_JSON).content(body(item, start, Duration.ofHours(1))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/reservations").header("Authorization", users.bearerFor(users.create(Role.TEACHER)))
                        .contentType(APPLICATION_JSON).content(body(item, start, Duration.ofHours(2))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldCancelOnlyOwnReservation() throws Exception {
        User owner = users.create(Role.STUDENT);
        Item item = items.create("Libro", ItemStatus.AVAILABLE);
        String response = mockMvc.perform(post("/api/reservations").header("Authorization", users.bearerFor(owner))
                        .contentType(APPLICATION_JSON).content(body(item, soon(), Duration.ofHours(1))))
                .andReturn().getResponse().getContentAsString();
        String id = response.replaceAll(".*\"id\":(\\d+).*", "$1");

        mockMvc.perform(post("/api/reservations/" + id + "/cancel")
                        .header("Authorization", users.bearerFor(users.create(Role.STUDENT))))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/reservations/" + id + "/cancel").header("Authorization", users.bearerFor(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void shouldListOnlyOwnReservationsInMeEndpoint() throws Exception {
        User owner = users.create(Role.STUDENT);
        mockMvc.perform(post("/api/reservations").header("Authorization", users.bearerFor(owner))
                .contentType(APPLICATION_JSON)
                .content(body(items.create("Libro", ItemStatus.AVAILABLE), soon(), Duration.ofHours(1))));

        mockMvc.perform(get("/api/me/reservations").header("Authorization", users.bearerFor(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/api/me/reservations")
                        .header("Authorization", users.bearerFor(users.create(Role.STUDENT))))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldAllowListingAllReservationsOnlyForStaff(Role role) throws Exception {
        boolean staff = role == Role.MANAGER || role == Role.ADMIN;

        mockMvc.perform(get("/api/reservations").header("Authorization", users.bearerFor(users.create(role))))
                .andExpect(staff ? status().isOk() : status().isForbidden());
    }

    @Test
    void shouldReturnAvailabilityForAnyRole() throws Exception {
        Item item = items.create("Libro", ItemStatus.AVAILABLE);
        Instant from = soon();

        mockMvc.perform(get("/api/items/" + item.getId() + "/availability")
                        .param("from", from.toString()).param("to", from.plusSeconds(3600).toString())
                        .header("Authorization", users.bearerFor(users.create(Role.STUDENT))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.busyRanges").isEmpty());
        mockMvc.perform(get("/api/items/" + item.getId() + "/availability")
                        .param("from", from.toString()).param("to", from.minusSeconds(60).toString())
                        .header("Authorization", users.bearerFor(users.create(Role.STUDENT))))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn404ForUnknownItemAvailability() throws Exception {
        Instant from = soon();

        mockMvc.perform(get("/api/items/-1/availability").param("from", from.toString())
                        .param("to", from.plusSeconds(60).toString())
                        .header("Authorization", users.bearerFor(users.create(Role.STUDENT))))
                .andExpect(status().isNotFound());
    }
}
