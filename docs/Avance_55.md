# Avance al 55 % – Sistema de Préstamos de la EPCC

Grupo 12. Fases 2 (Catálogo, 35 %) y 3 (Reservas núcleo, 55 %) del plan.

## Qué se agregó

**Fase 2 – Catálogo (RF-03, RF-07, RNF-01)**
- `ItemInventario` (aggregate root) con `TipoItem`, `EstadoFisico` y `EstadoDisponibilidad`.
  Reglas en el dominio: alta, modificación, baja lógica, cambio de estado físico
  (dañado → en mantenimiento; reparado → disponible), `marcar_prestado/disponible`
  (los usará la Fase 4) y no admitir cambios tras la baja.
- Persistencia SQLAlchemy con bloqueo optimista (`version`) y código único.
- API: `GET /items`, `GET /items/{id}`, `POST/PUT/DELETE /admin/items…`,
  `PUT /admin/items/{id}/estado-fisico`. Solo el administrador gestiona el inventario.
- Frontend: página **Catálogo** y **Panel de inventario** (alta, edición, estado físico, baja).

**Fase 3 – Reservas, núcleo (RF-05, RNF-02, RNF-03)**
- `FranjaHoraria` (intervalo semiabierto `[inicio, fin)`: dos franjas contiguas no se solapan)
  y `Reserva` con la máquina de estados del diagrama `estados_v2`
  (PENDIENTE → CONFIRMADA → CANCELADA / EXPIRADA / CONVERTIDA).
- `ValidadorDisponibilidadService`: rechaza reservas solapadas del mismo ítem y de ítems
  no reservables (de baja o en mantenimiento).
- Cuenta SUSPENDIDA no puede reservar (RN-02), consultando IAM por `UsuarioId` a través de
  un puerto (`IConsultaUsuarios`); el catálogo se consulta igual (`IConsultaItems`).
- Triple defensa contra duplicidad (RNF-02): dominio, revalidación en el repositorio justo
  antes de escribir, y restricción `EXCLUDE USING gist` en PostgreSQL.
- `expirar_vencidas()` marca EXPIRADA las reservas cuya franja pasó (lo invocará el scheduler en la Fase 4).
- API: `POST /reservas`, `GET /reservas/mias`, `DELETE /reservas/{id}`,
  `GET /items/{id}/disponibilidad`, `GET /admin/reservas`.
- Frontend: asistente de **reserva en 3 pasos** (ítem → horario con franjas ocupadas → confirmar),
  y **Mis reservas** con cancelación.

## Pruebas
103 funciones de prueba (104 casos): las 33 anteriores más 70 nuevas
(dominio, repositorio, servicio y API de Catálogo y Reservas).
`cd backend && pytest -v`

## Decisiones y limitaciones
- Las reservas se crean y confirman en un solo paso (`POST /reservas` devuelve CONFIRMADA);
  el estado PENDIENTE existe en el dominio pero dura solo dentro del caso de uso.
- Duración de reserva entre 15 minutos y 24 horas: valor provisional; la Fase 5
  lo reemplaza por `PoliticaPrestamo`.
- La restricción `EXCLUDE` solo se aplica con PostgreSQL; con SQLite (por defecto) la defensa
  es la del dominio y la revalidación del repositorio.
- El job periódico que invoca `expirar_vencidas()` queda para la Fase 4 (junto con `PrestamoVencido`).
- Un ítem prestado hoy sí puede reservarse para una fecha futura; uno en mantenimiento o de baja, no.
