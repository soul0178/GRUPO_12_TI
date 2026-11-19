# Política de sanciones

Una sanción **activa** impide reservar y recibir préstamos. Las duraciones están en
`backend/.../sanction/service/SanctionRules.java` (y se muestran al usuario en
`frontend/.../sanctions/types/sanctionPolicy.ts`; ambos deben coincidir).

## Tipos y duración base

| Tipo | Cuándo | Cómo se aplica | Días |
|---|---|---|---|
| No recoger reserva (`NO_SHOW`) | La reserva vence sin que se recoja el ítem | Automática | **1** (la mínima) |
| Atraso (`OVERDUE`) | Devolución después del vencimiento | Automática | 1 por día de atraso (máx. 30) |
| Daño leve | Desgaste o marcas que no impiden el uso (rayón, hojas dobladas) | Sugerida → la confirma el ADMIN | 3 |
| Daño moderado | Falla que afecta el uso (pantalla rota, hojas arrancadas) | Sugerida → la confirma el ADMIN | 15 |
| Daño extremo | El ítem queda inservible (equipo que no enciende, libro destruido) | Sugerida → la confirma el ADMIN | 60 · **falta grave** |
| Pérdida (`LOSS`) | El ítem no se devuelve (se da de baja, la garantía queda retenida) | Automática | **90** (la máxima) · **falta grave** |

El encargado indica el nivel del daño al registrar la devolución (pasar de Bueno a Regular
se sugiere como daño leve). El ADMIN puede cambiar el nivel y los días al confirmar; sin días
se aplica la tabla.

## Reincidencia

Se cuentan las sanciones (activas o finalizadas) iniciadas en los últimos 180 días:

| Sanciones previas | Multiplicador |
|---|---|
| 0 | ×1 |
| 1 | ×2 |
| 2 o más | ×3 |

Ninguna sanción calculada supera 90 días.

## Baneo

Con **más de 2 faltas graves** (pérdida o daño extremo confirmado, no levantadas) el usuario
queda **baneado**: se desactiva su cuenta y la sanción dura hasta que un ADMIN la levante.

## Levantar o reducir (solo ADMIN)

- **Levantar**: termina la sanción activa de inmediato (con motivo). Deja de contar para
  reincidencia y faltas graves. Si causó un baneo, reactiva al usuario.
- **Reducir**: fija una duración total menor (con motivo). Un baneo no se reduce, solo se levanta.

## Estados

`SUGGESTED` (pendiente del ADMIN) → `ACTIVE` → `FINISHED` (cumplió la fecha) o `LIFTED`
(levantada). Una sugerida puede ser `REJECTED`.
