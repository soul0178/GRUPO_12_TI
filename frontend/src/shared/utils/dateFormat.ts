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

/** Horario de atención (hora de Lima): se entrega desde las 07:00 y todo se devuelve antes de las 20:10. */
export const OPENING_TIME = '07:00';
export const CLOSING_TIME = '20:10';
export const BUSINESS_HOURS_LABEL = `${OPENING_TIME} a ${CLOSING_TIME}`;

/**
 * Indica si el inicio y el fin del rango caen dentro del horario de atención (pueden ser días distintos, p. ej. un
 * libro por 72 h). Recibe valores datetime-local (hora de Lima, "2026-03-10T10:30"). Misma regla que el backend.
 */
export function rangeWithinBusinessHours(startLocal: string, endLocal: string): boolean {
  const startTime = startLocal.slice(11, 16);
  const endTime = endLocal.slice(11, 16);
  return (
    startTime >= OPENING_TIME &&
    startTime <= CLOSING_TIME &&
    endTime >= OPENING_TIME &&
    endTime <= CLOSING_TIME
  );
}
