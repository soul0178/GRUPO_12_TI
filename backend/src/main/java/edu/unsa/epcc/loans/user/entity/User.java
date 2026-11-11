package edu.unsa.epcc.loans.user.entity;

import edu.unsa.epcc.loans.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Persona que usa el sistema: prestatario, encargado o administrador (RF-01). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    /** Correo institucional en minúsculas; es único y es el usuario del login. */
    @Column(nullable = false, unique = true)
    private String email;

    /** Código universitario o DNI; es único. */
    @Column(name = "document_number", nullable = false, unique = true)
    private String documentNumber;

    private String phone;

    /** Hash BCrypt de la contraseña; nunca se guarda ni se devuelve en texto plano. */
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /** Un usuario desactivado no puede iniciar sesión ni tener nuevos préstamos o reservas. */
    @Column(nullable = false)
    private boolean active = true;
}
