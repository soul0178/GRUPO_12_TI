import { formatDateTime, limaLocalToIso } from '@/shared/utils/dateFormat';

describe('formatDateTime', () => {
  it('muestra la hora de Lima (UTC-5) para un Instant en UTC', () => {
    const text = formatDateTime('2026-03-10T15:30:00Z');

    expect(text).toContain('10:30');
  });
});

describe('limaLocalToIso', () => {
  it('convierte una hora local de Lima a UTC sumando cinco horas', () => {
    expect(limaLocalToIso('2026-03-10T10:30')).toBe('2026-03-10T15:30:00.000Z');
  });
});
