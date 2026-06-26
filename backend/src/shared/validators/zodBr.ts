import { z } from 'zod';
import { isValidCEP, isValidCNPJ, isValidCPF, isValidPhone, stripDigits } from './brDocuments';

export function zNonEmptyString(message: string) {
  return z.string().trim().min(1, message);
}

export function zCpf(message = 'CPF inválido') {
  return z
    .string()
    .min(1, message)
    .transform(stripDigits)
    .refine((v) => isValidCPF(v), message);
}

export function zCnpj(message = 'CNPJ inválido') {
  return z
    .string()
    .min(1, message)
    .transform(stripDigits)
    .refine((v) => isValidCNPJ(v), message);
}

export function zPhone(message = 'Telefone inválido') {
  return z
    .string()
    .min(1, message)
    .transform(stripDigits)
    .refine((v) => isValidPhone(v), message);
}

export function zCep(message = 'CEP inválido') {
  return z
    .string()
    .min(1, message)
    .transform(stripDigits)
    .refine((v) => isValidCEP(v), message);
}

export function zOptionalCep(message = 'CEP inválido') {
  return z
    .string()
    .optional()
    .transform((v) => (v ? stripDigits(v) : v))
    .refine((v) => !v || isValidCEP(v), message);
}
