package edu.unsa.epcc.loans.auth.service;

import edu.unsa.epcc.loans.auth.dto.LoginRequest;
import edu.unsa.epcc.loans.auth.dto.LoginResponse;
import edu.unsa.epcc.loans.common.security.JwtService;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** Inicio de sesión: valida las credenciales con el módulo de usuarios y entrega un token JWT (RF-01). */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;

    /**
     * Devuelve el token y los datos del usuario.
     * Falla con 401 si las credenciales son incorrectas y con 403 si el usuario está desactivado.
     */
    public LoginResponse login(LoginRequest request) {
        UserResponse user = userService.authenticate(request.email(), request.password());
        String token = jwtService.generateToken(user.id(), user.email(), user.role().name());
        return new LoginResponse(token, user);
    }
}
