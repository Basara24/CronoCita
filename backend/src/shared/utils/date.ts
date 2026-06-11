export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function diffInHours(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / 3_600_000;
}

/**
 * Verifica se dois intervalos de tempo se sobrepõem.
 * Intervalos adjacentes (fim de um == início do outro) NÃO conflitam.
 */
export function hasOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}
