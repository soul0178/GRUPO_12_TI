import type { DamageLevel } from '@/features/sanctions/types/sanction';

/** Duraciones de la política de sanciones. Deben coincidir con SanctionRules del backend. */
export const SANCTION_DAYS = {
  noShow: 1,
  minorDamage: 3,
  moderateDamage: 15,
  severeDamage: 60,
  loss: 90,
  maxGraveFaults: 2,
} as const;

export const DAMAGE_LEVEL_INFO: Record<
  DamageLevel,
  { days: number; description: string; examples: string }
> = {
  MINOR: {
    days: SANCTION_DAYS.minorDamage,
    description: 'marcas o desgaste que no impiden usar el ítem',
    examples: 'un rayón, la etiqueta despegada, hojas dobladas',
  },
  MODERATE: {
    days: SANCTION_DAYS.moderateDamage,
    description: 'una falla que afecta el uso',
    examples: 'pantalla rota, teclas sueltas, hojas arrancadas',
  },
  SEVERE: {
    days: SANCTION_DAYS.severeDamage,
    description: 'el ítem queda inservible (falta grave)',
    examples: 'un equipo que ya no enciende, un libro destruido',
  },
};
