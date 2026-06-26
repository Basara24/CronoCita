/** Gera um CPF válido determinístico a partir de um seed (para testes E2E). */
export function generateValidCpf(seed: number): string {
  const base = String(Math.abs(seed) % 1000000000).padStart(9, '0');
  if (/^(\d)\1{8}$/.test(base)) return generateValidCpf(seed + 1);

  const digit = (digits: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) sum += Number(digits[i]) * weights[i];
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };

  const d1 = digit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digit(base + String(d1), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return base + String(d1) + String(d2);
}
