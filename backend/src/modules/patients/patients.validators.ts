import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  birthDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Data de nascimento inválida'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();
