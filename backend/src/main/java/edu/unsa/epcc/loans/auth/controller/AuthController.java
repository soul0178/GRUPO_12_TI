package edu.unsa.epcc.loans.auth.controller;

import edu.unsa.epcc.loans.auth.dto.LoginRequest;
import edu.unsa.epcc.loans.auth.dto.LoginResponse;
import edu.unsa.epcc.loans.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint público de inicio de sesión. */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** Inicia sesión con correo y contraseña y devuelve el token JWT. */
    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }
}
