package edu.unsa.epcc.loans.inventory.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Estado de un ítem. ON_LOAN lo fija el módulo de préstamos; RETIRED (baja) es definitivo. */
@Getter
@RequiredArgsConstructor
public enum ItemStatus {
    AVAILABLE("Disponible"),
    ON_LOAN("Prestado"),
    OUT_OF_SERVICE("Fuera de servicio"),
    RETIRED("De baja");

    /** Nombre en español para mensajes al usuario. */
    private final String label;
}
