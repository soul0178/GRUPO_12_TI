package edu.unsa.epcc.loans.sanction.entity;

import edu.unsa.epcc.loans.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Parámetros de política editables por el ADMIN. La tabla tiene una única fila (id = 1). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "policy_settings")
public class PolicySettings extends BaseEntity {

    /** Máximo de préstamos activos (más reservas pendientes) por usuario. */
    @Column(name = "max_active_items", nullable = false)
    private int maxActiveItems;

    /** Minutos desde el inicio de una reserva tras los cuales expira si no se recoge el ítem. */
    @Column(name = "reservation_expiration_minutes", nullable = false)
    private int reservationExpirationMinutes;
}
