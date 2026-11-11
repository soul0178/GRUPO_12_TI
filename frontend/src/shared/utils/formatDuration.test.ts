import { formatHours } from '@/shared/utils/formatDuration';

describe('formatHours', () => {
  it.each([
    [1, '1 hora'],
    [4, '4 horas'],
    [24, '24 horas (1 día)'],
    [72, '72 horas (3 días)'],
    [30, '30 horas'],
  ])('formatea %i horas como "%s"', (hours, expected) => {
    expect(formatHours(hours)).toBe(expected);
  });
});
