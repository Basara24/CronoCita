import { z } from 'zod';
import { isValidCEP, isValidCNPJ, isValidCPF, isValidPhone, stripDigits } from './brDocuments';

export function zNonEmptyString(message: string) {
  return z.string().trim().min(1, message);
}

export function zCpf(message = 'CPF inválido') {
  return z.string().min(1, message).refine((v) => isValidCPF(v), message);
}

export function zCnpj(message = 'CNPJ inválido') {
  return z.string().min(1, message).refine((v) => isValidCNPJ(v), message);
}

export function zPhone(message = 'Telefone inválido') {
  return z.string().min(1, message).refine((v) => isValidPhone(v), message);
}

export function zCep(message = 'CEP inválido') {
  return z.string().min(1, message).refine((v) => isValidCEP(v), message);
}

export function zBrDate(message = 'Data inválida') {
  return z
    .string()
    .min(1, message)
    .refine((v) => /^\d{2}\/\d{2}\/\d{4}$/.test(v) || !Number.isNaN(Date.parse(v)), message)
    .refine((v) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
      const [d, m, y] = v.split('/').map(Number);
      const date = new Date(y, m - 1, d);
      return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
    }, message);
}

/** Converte DD/MM/AAAA ou AAAA-MM-DD para ISO (AAAA-MM-DD). */
export function parseBrDateToISO(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [d, m, y] = value.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Converte AAAA-MM-DD para DD/MM/AAAA (exibição em formulários). */
export function isoToBrDate(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.slice(0, 10).split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

/** Envia CPF/CNPJ/telefone/CEP apenas com dígitos ao backend. */
export function digitsOnly(value: string): string {
  return stripDigits(value);
}
