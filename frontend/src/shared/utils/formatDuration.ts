const HOURS_PER_DAY = 24;

/** Muestra un plazo en horas de forma legible: "4 horas", "24 horas (1 día)", "72 horas (3 días)". */
export function formatHours(hours: number): string {
  const base = `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (hours < HOURS_PER_DAY || hours % HOURS_PER_DAY !== 0) {
    return base;
  }
  const days = hours / HOURS_PER_DAY;
  return `${base} (${days} ${days === 1 ? 'día' : 'días'})`;
}
