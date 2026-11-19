import {
  formatDateTime,
  limaLocalToIso,
  rangeTouchesSunday,
  rangeWithinBusinessHours,
} from '@/shared/utils/dateFormat';

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

describe('rangeTouchesSunday', () => {
  // 10/03/2030 es domingo
  it('detecta un rango dentro del domingo', () => {
    expect(rangeTouchesSunday('2030-03-10T10:00', '2030-03-10T12:00')).toBe(true);
  });

  it('detecta un rango que entra o sale del domingo', () => {
    expect(rangeTouchesSunday('2030-03-09T23:00', '2030-03-10T01:00')).toBe(true);
    expect(rangeTouchesSunday('2030-03-10T23:00', '2030-03-11T01:00')).toBe(true);
  });

  it('permite sábado y lunes', () => {
    expect(rangeTouchesSunday('2030-03-09T10:00', '2030-03-09T12:00')).toBe(false);
    expect(rangeTouchesSunday('2030-03-11T10:00', '2030-03-11T12:00')).toBe(false);
  });

  it('un rango que termina a las 00:00 del domingo no lo toca', () => {
    expect(rangeTouchesSunday('2030-03-09T22:00', '2030-03-10T00:00')).toBe(false);
    expect(rangeTouchesSunday('2030-03-10T00:00', '2030-03-10T01:00')).toBe(true);
  });
});

describe('rangeWithinBusinessHours', () => {
  it('acepta rangos del mismo día entre las 07:00 y las 20:10', () => {
    expect(rangeWithinBusinessHours('2030-03-12T07:00', '2030-03-12T20:10')).toBe(true);
    expect(rangeWithinBusinessHours('2030-03-12T10:00', '2030-03-12T12:00')).toBe(true);
  });

  it('rechaza rangos que empiezan antes de abrir o terminan después de cerrar', () => {
    expect(rangeWithinBusinessHours('2030-03-12T06:59', '2030-03-12T09:00')).toBe(false);
    expect(rangeWithinBusinessHours('2030-03-12T19:00', '2030-03-12T20:11')).toBe(false);
  });

  it('rechaza rangos que cruzan de un día a otro', () => {
    expect(rangeWithinBusinessHours('2030-03-12T10:00', '2030-03-13T10:00')).toBe(false);
  });
});
