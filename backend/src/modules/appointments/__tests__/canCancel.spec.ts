import { canCancel } from '../availability';

describe('canCancel()', () => {
  const now = new Date('2030-01-10T10:00:00');

  it('permite cancelar com mais de 2 horas de antecedência', () => {
    const startsAt = new Date('2030-01-10T13:00:00'); // 3h depois
    expect(canCancel(startsAt, now)).toBe(true);
  });

  it('permite cancelar com exatamente 2 horas de antecedência', () => {
    const startsAt = new Date('2030-01-10T12:00:00'); // exatamente 2h
    expect(canCancel(startsAt, now)).toBe(true);
  });

  it('bloqueia cancelamento com menos de 2 horas de antecedência', () => {
    const startsAt = new Date('2030-01-10T11:30:00'); // 1h30 depois
    expect(canCancel(startsAt, now)).toBe(false);
  });

  it('bloqueia cancelamento de consulta que já começou', () => {
    const startsAt = new Date('2030-01-10T09:00:00'); // no passado
    expect(canCancel(startsAt, now)).toBe(false);
  });
});
