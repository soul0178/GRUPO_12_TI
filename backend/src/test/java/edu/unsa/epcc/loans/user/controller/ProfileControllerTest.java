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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

/** API de /me (RF-02): ver perfil, editar contacto sin tocar rol/correo y cambiar contraseña. */
class ProfileControllerTest extends IntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private TestUserFactory users;

    @Test
    void shouldReturnOwnProfile() throws Exception {
        User user = users.create(Role.TEACHER);

        mockMvc.perform(get("/api/me").header("Authorization", users.bearerFor(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(user.getEmail()))
                .andExpect(jsonPath("$.role").value("TEACHER"));
    }

    @Test
    void shouldUpdateContactDataButNotRoleOrEmail() throws Exception {
        User user = users.create(Role.STUDENT);

        mockMvc.perform(put("/api/me").header("Authorization", users.bearerFor(user))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"firstName":"Luis","lastName":"Mamani","phone":"987654321",
                                 "role":"ADMIN","email":"hacker@x.com"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Luis"))
                .andExpect(jsonPath("$.phone").value("987654321"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.email").value(user.getEmail()));
    }

    @Test
    void shouldReturn400WhenProfileNamesAreBlank() throws Exception {
        String bearer = users.bearerFor(users.create(Role.STUDENT));

        mockMvc.perform(put("/api/me").header("Authorization", bearer).contentType(APPLICATION_JSON)
                        .content("{\"firstName\":\"\",\"lastName\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldChangePasswordAndLoginWithTheNewOne() throws Exception {
        User user = users.create(Role.STUDENT);

        mockMvc.perform(put("/api/me/password").header("Authorization", users.bearerFor(user))
                        .contentType(APPLICATION_JSON)
                        .content("{\"currentPassword\":\"" + TestUserFactory.PASSWORD
                                + "\",\"newPassword\":\"NuevaClave99\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/auth/login").contentType(APPLICATION_JSON)
                        .content("{\"email\":\"" + user.getEmail() + "\",\"password\":\"NuevaClave99\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn409WhenCurrentPasswordIsWrong() throws Exception {
        String bearer = users.bearerFor(users.create(Role.STUDENT));

        mockMvc.perform(put("/api/me/password").header("Authorization", bearer).contentType(APPLICATION_JSON)
                        .content("{\"currentPassword\":\"mala\",\"newPassword\":\"NuevaClave99\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("La contraseña actual es incorrecta"));
    }
}
