import { calculateCommission } from '../calculateCommission';

describe('calculateCommission()', () => {
  it('calcula corretamente o exemplo da regra: R$ 200 a 70% → R$ 140 / R$ 60', () => {
    const result = calculateCommission(200, 70);
    expect(result.professionalValue).toBe(140);
    expect(result.clinicValue).toBe(60);
  });

  it('soma das partes sempre é igual ao valor total', () => {
    const result = calculateCommission(199.99, 33);
    expect(result.professionalValue + result.clinicValue).toBeCloseTo(199.99, 2);
  });

  it('arredonda para 2 casas decimais', () => {
    const result = calculateCommission(100, 33.33);
    expect(result.professionalValue).toBe(33.33);
    expect(result.clinicValue).toBe(66.67);
  });

  it('suporta 0% (tudo para a clínica)', () => {
    const result = calculateCommission(150, 0);
    expect(result.professionalValue).toBe(0);
    expect(result.clinicValue).toBe(150);
  });

  it('suporta 100% (tudo para o profissional)', () => {
    const result = calculateCommission(150, 100);
    expect(result.professionalValue).toBe(150);
    expect(result.clinicValue).toBe(0);
  });

  it('rejeita percentual inválido', () => {
    expect(() => calculateCommission(100, 120)).toThrow();
    expect(() => calculateCommission(100, -1)).toThrow();
  });

  it('rejeita valor negativo', () => {
    expect(() => calculateCommission(-50, 70)).toThrow();
  });
});
