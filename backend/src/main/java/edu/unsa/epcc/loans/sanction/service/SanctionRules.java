package edu.unsa.epcc.loans.sanction.service;

import edu.unsa.epcc.loans.sanction.entity.DamageLevel;

/**
 * Política de sanciones: duraciones base por tipo, tope y recargo por reincidencia. Es la única fuente de estos
 * números; el texto informativo de la reserva y docs/politica-sanciones.md deben coincidir con ellos.
 */
public final class SanctionRules {

    /** No recoger una reserva: la sanción más corta posible. */
    public static final int NO_SHOW_DAYS = 1;
    public static final int MINOR_DAMAGE_DAYS = 3;
    public static final int MODERATE_DAMAGE_DAYS = 15;
    public static final int SEVERE_DAMAGE_DAYS = 60;
    /** Pérdida del ítem: la sanción más larga posible. */
    public static final int LOSS_DAYS = 90;
    /** El atraso se sanciona con un día por día de atraso, hasta este máximo. */
    public static final int MAX_OVERDUE_DAYS = 30;
    /** Tope de cualquier sanción calculada (el ADMIN puede fijar otra duración al confirmar un daño). */
    public static final int MAX_DAYS = LOSS_DAYS;
    /** Duración de la sanción que acompaña al baneo (10 años: en la práctica, hasta que un ADMIN la levante). */
    public static final int BAN_DAYS = 3650;
    /** Solo cuentan para la reincidencia las sanciones iniciadas en los últimos días indicados. */
    public static final int RECIDIVISM_WINDOW_DAYS = 180;
    /** Con más de este número de faltas graves (pérdida o daño extremo) el usuario queda baneado. */
    public static final int MAX_GRAVE_FAULTS = 2;

    private SanctionRules() {
    }

    /** Días base de un daño según su nivel. */
    public static int damageDays(DamageLevel level) {
        return switch (level) {
            case MINOR -> MINOR_DAMAGE_DAYS;
            case MODERATE -> MODERATE_DAMAGE_DAYS;
            case SEVERE -> SEVERE_DAMAGE_DAYS;
        };
    }

    /** Multiplicador por reincidencia: 1 sin sanciones previas, 2 con una, 3 con dos o más. */
    public static int recidivismFactor(long previousSanctions) {
        return (int) Math.min(3, 1 + Math.max(0, previousSanctions));
    }

    /** Días finales: base por multiplicador de reincidencia, sin superar {@link #MAX_DAYS}. */
    public static int daysWithRecidivism(int baseDays, long previousSanctions) {
        return Math.min(MAX_DAYS, baseDays * recidivismFactor(previousSanctions));
    }
}
