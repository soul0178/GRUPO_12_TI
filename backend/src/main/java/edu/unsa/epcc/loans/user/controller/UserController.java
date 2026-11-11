package edu.unsa.epcc.loans.user.controller;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.security.AuthenticatedUser;
import edu.unsa.epcc.loans.user.dto.CreateUserRequest;
import edu.unsa.epcc.loans.user.dto.UpdateUserRequest;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.dto.UserSummaryResponse;
import edu.unsa.epcc.loans.user.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Gestión de usuarios; solo para ADMIN (RF-01), salvo la búsqueda de usuarios que también usa el encargado. */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** Lista los usuarios paginados, ordenados por apellidos. */
    @GetMapping
    public PageResponse<UserResponse> findAll(
            @PageableDefault(size = 20, sort = "lastName", direction = Sort.Direction.ASC) Pageable pageable) {
        return userService.findAll(pageable);
    }

    /** Busca usuarios por nombre, correo o código/DNI con datos mínimos; también para el encargado (MANAGER). */
    @GetMapping("/lookup")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public List<UserSummaryResponse> lookup(@RequestParam(required = false) String text) {
        return userService.lookup(text);
    }

    /** Devuelve un usuario por id. */
    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    /** Crea un usuario. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    /** Edita los datos de un usuario. */
    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(id, request);
    }

    /** Activa un usuario. */
    @PostMapping("/{id}/activate")
    public UserResponse activate(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser current) {
        return userService.setActive(id, true, current.id());
    }

    /** Desactiva un usuario. */
    @PostMapping("/{id}/deactivate")
    public UserResponse deactivate(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser current) {
        return userService.setActive(id, false, current.id());
    }
}
