package edu.unsa.epcc.loans.user.service;

import edu.unsa.epcc.loans.common.dto.PageResponse;
import edu.unsa.epcc.loans.common.exception.BusinessException;
import edu.unsa.epcc.loans.common.exception.NotFoundException;
import edu.unsa.epcc.loans.user.dto.ChangePasswordRequest;
import edu.unsa.epcc.loans.user.dto.CreateUserRequest;
import edu.unsa.epcc.loans.user.dto.UpdateProfileRequest;
import edu.unsa.epcc.loans.user.dto.UpdateUserRequest;
import edu.unsa.epcc.loans.user.dto.UserResponse;
import edu.unsa.epcc.loans.user.dto.UserSummaryResponse;
import edu.unsa.epcc.loans.user.entity.User;
import edu.unsa.epcc.loans.user.mapper.UserMapper;
import edu.unsa.epcc.loans.user.repository.UserRepository;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestiona usuarios, perfiles y credenciales (RF-01 y RF-02). */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private static final int LOOKUP_LIMIT = 10;

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    /** Crea un usuario con la contraseña cifrada. Lanza BusinessException si el correo o el código/DNI ya existen. */
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("Ya existe un usuario con el correo " + email);
        }
        if (userRepository.existsByDocumentNumber(request.documentNumber())) {
            throw new BusinessException("Ya existe un usuario con el código o DNI " + request.documentNumber());
        }
        User user = userMapper.toEntity(request);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        User saved = userRepository.save(user);
        log.info("Usuario creado: id={}, rol={}", saved.getId(), saved.getRole());
        return userMapper.toResponse(saved);
    }

    /** Lista los usuarios de forma paginada. */
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> findAll(Pageable pageable) {
        return PageResponse.from(userRepository.findAll(pageable).map(userMapper::toResponse));
    }

    /** Devuelve un usuario por id. Lanza NotFoundException si no existe. */
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userMapper.toResponse(getUser(id));
    }

    /** Edita los datos de un usuario (ADMIN). Lanza BusinessException si el correo o el código/DNI son de otro. */
    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = getUser(id);
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailAndIdNot(email, id)) {
            throw new BusinessException("Ya existe un usuario con el correo " + email);
        }
        if (userRepository.existsByDocumentNumberAndIdNot(request.documentNumber(), id)) {
            throw new BusinessException("Ya existe un usuario con el código o DNI " + request.documentNumber());
        }
        userMapper.update(request, user);
        user.setEmail(email);
        return userMapper.toResponse(user);
    }

    /**
     * Activa o desactiva un usuario. Lanza BusinessException si un ADMIN intenta desactivarse a sí mismo,
     * para no quedarse sin acceso.
     */
    @Transactional
    public UserResponse setActive(Long id, boolean active, Long currentUserId) {
        if (!active && id.equals(currentUserId)) {
            throw new BusinessException("No puede desactivar su propio usuario");
        }
        User user = getUser(id);
        user.setActive(active);
        log.info("Usuario {} {}", id, active ? "activado" : "desactivado");
        return userMapper.toResponse(user);
    }

    /** Actualiza los datos de contacto del propio usuario (RF-02). */
    @Transactional
    public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
        User user = getUser(id);
        userMapper.updateProfile(request, user);
        return userMapper.toResponse(user);
    }

    /** Cambia la contraseña del usuario. Lanza BusinessException si la contraseña actual no coincide. */
    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = getUser(id);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessException("La contraseña actual es incorrecta");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    /**
     * Verifica correo y contraseña para el login (RF-01).
     * Lanza BadCredentialsException si son incorrectos y DisabledException si el usuario está desactivado.
     */
    @Transactional(readOnly = true)
    public UserResponse authenticate(String email, String password) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .filter(found -> passwordEncoder.matches(password, found.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Credenciales incorrectas"));
        if (!user.isActive()) {
            throw new DisabledException("Usuario desactivado");
        }
        return userMapper.toResponse(user);
    }

    /**
     * Busca usuarios por nombre, correo o código/DNI para el personal (máximo 10 resultados).
     * Si el texto está vacío devuelve una lista vacía.
     */
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> lookup(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        String pattern = "%" + text.trim().toLowerCase(Locale.ROOT) + "%";
        return userRepository.search(pattern, PageRequest.of(0, LOOKUP_LIMIT, Sort.by("lastName", "firstName")))
                .stream().map(userMapper::toSummary).toList();
    }

    private User getUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No existe el usuario con id " + id));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
