const DEFAULT_COUNTRY_CODE = '55';

/**
 * Normaliza telefone brasileiro para o formato esperado pela Evolution API:
 * apenas dígitos, com DDI (ex.: 5511999999999).
 */
export function normalizePhoneForWhatsApp(phone: string, countryCode = DEFAULT_COUNTRY_CODE): string {
  let digits = phone.replace(/\D/g, '');

  // Remove zero à esquerda de discagem (ex.: 011...)
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }

  // Já inclui DDI (55 + DDD + número)
  if (digits.startsWith(countryCode) && digits.length >= countryCode.length + 10) {
    return digits;
  }

  // Número local BR (10 ou 11 dígitos: DDD + fixo/celular)
  if (digits.length === 10 || digits.length === 11) {
    return `${countryCode}${digits}`;
  }

  return digits;
}
