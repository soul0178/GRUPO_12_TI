const LIMA_TIME_ZONE = 'America/Lima';

const dateTimeFormat = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: LIMA_TIME_ZONE,
});

/** Convierte un Instant ISO 8601 (UTC) del backend a fecha y hora en zona America/Lima. */
export function formatDateTime(isoInstant: string): string {
  return dateTimeFormat.format(new Date(isoInstant));
}

/**
 * Convierte el valor de un campo datetime-local (fecha y hora de Lima, "2026-03-10T10:30") a un Instant ISO
 * en UTC para enviarlo al backend. Lima no tiene horario de verano: siempre es UTC-5.
 */
export function limaLocalToIso(localValue: string): string {
  return new Date(`${localValue}:00-05:00`).toISOString();
}
