package edu.unsa.epcc.loans.sanction.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** Gravedad de un daño. SEVERE (extremo) cuenta como falta grave, igual que la pérdida del ítem. */
@Getter
@RequiredArgsConstructor
public enum DamageLevel {
    MINOR("Leve"),
    MODERATE("Moderado"),
    SEVERE("Extremo");

    /** Nombre en español para mensajes al usuario. */
    private final String label;
}
