package edu.unsa.epcc.loans.user.controller;

import edu.unsa.epcc.loans.common.security.AuthenticatedUser;
import edu.unsa.epcc.loans.user.dto.ChangePasswordRequest;
import edu.unsa.epcc.loans.user.dto.UpdateProfileRequest;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Perfil del usuario autenticado: ver sus datos, editar su contacto y cambiar su contraseña (RF-02). */
@RestController
@RequestMapping("/api/me")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class ProfileController {

    private final UserService userService;

    /** Devuelve el perfil del usuario autenticado. */
    @GetMapping
    public UserResponse getProfile(@AuthenticationPrincipal AuthenticatedUser current) {
        return userService.findById(current.id());
    }

    /** Edita nombres, apellidos y teléfono del usuario autenticado. */
    @PutMapping
    public UserResponse updateProfile(@AuthenticationPrincipal AuthenticatedUser current,
                                      @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(current.id(), request);
    }

    /** Cambia la contraseña del usuario autenticado. */
    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal AuthenticatedUser current,
                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(current.id(), request);
    }
}
