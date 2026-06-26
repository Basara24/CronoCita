import { z } from 'zod';
import { zCpf, zNonEmptyString, zOptionalCep, zPhone } from '../../shared/validators/zodBr';

export const createPatientSchema = z.object({
  name: zNonEmptyString('Nome é obrigatório').min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: zCpf(),
  email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  phone: zPhone(),
  birthDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Data de nascimento inválida'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: zOptionalCep().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();
