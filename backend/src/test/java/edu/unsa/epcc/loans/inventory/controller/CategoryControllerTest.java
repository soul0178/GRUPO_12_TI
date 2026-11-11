package edu.unsa.epcc.loans.inventory.controller;

import static org.hamcrest.Matchers.hasItems;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import edu.unsa.epcc.loans.inventory.entity.Category;
import edu.unsa.epcc.loans.support.IntegrationTestBase;
import edu.unsa.epcc.loans.support.TestItemFactory;
import edu.unsa.epcc.loans.support.TestUserFactory;
import edu.unsa.epcc.loans.user.entity.Role;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de /categories: las tres categorías iniciales, lectura para todos y edición solo ADMIN. */
class CategoryControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;
    @Autowired
    private TestItemFactory items;

    private String bearer(Role role) {
        return users.bearerFor(users.create(role));
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldListSeededCategoriesForEveryRole(Role role) throws Exception {
        mockMvc.perform(get("/api/categories").header("Authorization", bearer(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name").value(hasItems("Equipo", "Libro", "Objeto")));
    }

    @Test
    void shouldSeedDefaultPolicyForEquipoAndLibro() throws Exception {
        mockMvc.perform(get("/api/categories").header("Authorization", bearer(Role.STUDENT)))
                .andExpect(jsonPath("$[?(@.name=='Equipo')].maxLoanHours").value(4))
                .andExpect(jsonPath("$[?(@.name=='Equipo')].requiresGuarantee").value(true))
                .andExpect(jsonPath("$[?(@.name=='Libro')].maxLoanHours").value(72))
                .andExpect(jsonPath("$[?(@.name=='Libro')].requiresGuarantee").value(false));
    }

    @Test
    void shouldReturn401WhenListingCategoriesWithoutToken() throws Exception {
        mockMvc.perform(get("/api/categories")).andExpect(status().isUnauthorized());
    }

    @Test
    void shouldUpdateCategoryPolicyWhenAdmin() throws Exception {
        Category category = items.category("Objeto");

        mockMvc.perform(put("/api/categories/" + category.getId()).header("Authorization", bearer(Role.ADMIN))
                        .contentType(APPLICATION_JSON)
                        .content("{\"maxLoanHours\":48,\"requiresGuarantee\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxLoanHours").value(48))
                .andExpect(jsonPath("$.requiresGuarantee").value(true));
    }

    @ParameterizedTest
    @EnumSource(value = Role.class, names = "ADMIN", mode = EnumSource.Mode.EXCLUDE)
    void shouldReturn403WhenNonAdminUpdatesCategory(Role role) throws Exception {
        Category category = items.category("Libro");

        mockMvc.perform(put("/api/categories/" + category.getId()).header("Authorization", bearer(role))
                        .contentType(APPLICATION_JSON)
                        .content("{\"maxLoanHours\":10,\"requiresGuarantee\":false}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturn400WhenMaxLoanHoursIsNotPositive() throws Exception {
        Category category = items.category("Objeto");

        mockMvc.perform(put("/api/categories/" + category.getId()).header("Authorization", bearer(Role.ADMIN))
                        .contentType(APPLICATION_JSON)
                        .content("{\"maxLoanHours\":0,\"requiresGuarantee\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldReturn404WhenCategoryDoesNotExist() throws Exception {
        mockMvc.perform(put("/api/categories/-1").header("Authorization", bearer(Role.ADMIN))
                        .contentType(APPLICATION_JSON)
                        .content("{\"maxLoanHours\":5,\"requiresGuarantee\":false}"))
                .andExpect(status().isNotFound());
    }
}
