package edu.unsa.epcc.loans.inventory.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.unsa.epcc.loans.inventory.entity.Item;
import edu.unsa.epcc.loans.inventory.entity.ItemStatus;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestItemFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de /items: cualquiera consulta; solo MANAGER y ADMIN escriben; validaciones y reglas. */
class ItemControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;

    private String createBody(String code, Long categoryId) {
        return """
                {"code":"%s","name":"Proyector","description":"Sala 3","categoryId":%d}""".formatted(code, categoryId);
    }

    private String bearer(Role role) {
        return users.bearerFor(users.create(role));
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldAllowEveryRoleToConsultTheCatalog(Role role) throws Exception {
        Item item = items.create("Libro", ItemStatus.AVAILABLE);

        mockMvc.perform(get("/api/items/" + item.getId()).header("Authorization", bearer(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(item.getCode()))
                .andExpect(jsonPath("$.category.name").value("Libro"));
        mockMvc.perform(get("/api/items").header("Authorization", bearer(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void shouldReturn401WhenConsultingCatalogWithoutToken() throws Exception {
        mockMvc.perform(get("/api/items")).andExpect(status().isUnauthorized());
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"STUDENT", "TEACHER", "ADMINISTRATIVE"})
    void shouldReturn403WhenBorrowerTriesToWriteInventory(Role role) throws Exception {
        String bearer = bearer(role);
        Item item = items.create("Libro", ItemStatus.AVAILABLE);
        Long categoryId = item.getCategory().getId();

        mockMvc.perform(post("/api/items").header("Authorization", bearer).contentType(APPLICATION_JSON)
                        .content(createBody("N-" + UUID.randomUUID(), categoryId)))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/items/" + item.getId()).header("Authorization", bearer)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"code":"A","name":"B","categoryId":%d,"status":"AVAILABLE"}""".formatted(categoryId)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/items/" + item.getId() + "/retire").header("Authorization", bearer))
                .andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = {"MANAGER", "ADMIN"})
    void shouldCreateItemWhenRoleIsStaff(Role role) throws Exception {
        Long categoryId = items.category("Equipo").getId();
        String code = "EQ-" + UUID.randomUUID().toString().substring(0, 8);

        mockMvc.perform(post("/api/items").header("Authorization", bearer(role)).contentType(APPLICATION_JSON)
                        .content(createBody(code, categoryId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andExpect(jsonPath("$.category.requiresGuarantee").value(true));
    }

    @Test
    void shouldReturn400WhenItemDataIsInvalid() throws Exception {
        mockMvc.perform(post("/api/items").header("Authorization", bearer(Role.MANAGER))
                        .contentType(APPLICATION_JSON).content("{\"code\":\"\",\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn409WhenCodeIsDuplicated() throws Exception {
        Item existing = items.create("Objeto", ItemStatus.AVAILABLE);

        mockMvc.perform(post("/api/items").header("Authorization", bearer(Role.ADMIN))
                        .contentType(APPLICATION_JSON)
                        .content(createBody(existing.getCode(), existing.getCategory().getId())))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldReturn404WhenItemDoesNotExist() throws Exception {
        mockMvc.perform(get("/api/items/-1").header("Authorization", bearer(Role.STUDENT)))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldRetireItemAndRejectRetiringAgain() throws Exception {
        String bearer = bearer(Role.MANAGER);
        Item item = items.create("Equipo", ItemStatus.AVAILABLE);

        mockMvc.perform(post("/api/items/" + item.getId() + "/retire").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETIRED"));
        mockMvc.perform(post("/api/items/" + item.getId() + "/retire").header("Authorization", bearer))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldFilterCatalogByStatusParameter() throws Exception {
        Item retired = items.create("Libro", ItemStatus.RETIRED);

        mockMvc.perform(get("/api/items").param("status", "RETIRED").param("text", retired.getCode())
                        .header("Authorization", bearer(Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(retired.getId()));
    }
}
