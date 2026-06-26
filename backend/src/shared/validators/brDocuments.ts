/** Remove tudo que não for dígito. */
export function stripDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function allSameDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

/** Valida CPF brasileiro (11 dígitos + verificadores). */
export function isValidCPF(cpf: string): boolean {
  const digits = stripDigits(cpf);
  if (digits.length !== 11 || allSameDigits(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(digits[10]);
}

/** Valida CNPJ brasileiro (14 dígitos + verificadores). */
export function isValidCNPJ(cnpj: string): boolean {
  const digits = stripDigits(cnpj);
  if (digits.length !== 14 || allSameDigits(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== Number(digits[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += Number(digits[i]) * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === Number(digits[13]);
}

/** Valida telefone brasileiro (10 ou 11 dígitos). */
export function isValidPhone(phone: string): boolean {
  const digits = stripDigits(phone);
  return digits.length >= 10 && digits.length <= 11;
}

/** Valida CEP brasileiro (8 dígitos). */
export function isValidCEP(cep: string): boolean {
  return stripDigits(cep).length === 8;
}
