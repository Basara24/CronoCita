export interface CommissionResult {
  professionalValue: number;
  clinicValue: number;
}

/**
 * Cálculo automático de comissão.
 *
 * Exemplo: consulta de R$ 200 com profissional a 70%
 * → profissional recebe R$ 140 e a clínica R$ 60.
 */
export function calculateCommission(totalValue: number, percentage: number): CommissionResult {
  if (totalValue < 0) {
    throw new Error('Valor total não pode ser negativo');
  }
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentual de comissão deve estar entre 0 e 100');
  }

  const professionalValue = Math.round(totalValue * percentage) / 100;
  const clinicValue = Math.round((totalValue - professionalValue) * 100) / 100;

  return { professionalValue, clinicValue };
}
