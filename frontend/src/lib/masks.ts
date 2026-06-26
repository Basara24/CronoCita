import { stripDigits } from './validators/brDocuments';

export type MaskType = 'cpf' | 'cnpj' | 'phone' | 'cep' | 'date';

export function applyMask(mask: MaskType, raw: string): string {
  const digits = stripDigits(raw);

  switch (mask) {
    case 'cpf':
      return digits
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    case 'cnpj':
      return digits
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    case 'phone':
      return formatPhone(digits.slice(0, 11));
    case 'cep':
      return digits.slice(0, 8).replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
    case 'date':
      return digits
        .slice(0, 8)
        .replace(/^(\d{2})(\d)/, '$1/$2')
        .replace(/^(\d{2})\/(\d{2})(\d{1,4})$/, '$1/$2/$3');
    default:
      return raw;
  }
}

function formatPhone(digits: string): string {
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}
