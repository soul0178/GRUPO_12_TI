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

/**
 * Indica si el rango [inicio, fin) toca un domingo. Recibe valores datetime-local (hora de Lima, "2026-03-10T10:30").
 * Un rango que termina justo a las 00:00 de un domingo no lo toca. Misma regla que el backend.
 */
export function rangeTouchesSunday(startLocal: string, endLocal: string): boolean {
  const DAY_MS = 86_400_000;
  const startDay = Date.parse(`${startLocal.slice(0, 10)}T00:00:00Z`);
  let lastDay = Date.parse(`${endLocal.slice(0, 10)}T00:00:00Z`);
  if (endLocal.slice(11, 16) === '00:00') {
    lastDay -= DAY_MS;
  }
  for (let day = startDay; day <= lastDay; day += DAY_MS) {
    if (new Date(day).getUTCDay() === 0) {
      return true;
    }
  }
  return false;
}
