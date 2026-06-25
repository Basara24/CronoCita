import { z } from 'zod';

export const createClinicSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  cnpj: z.string().min(11, 'CNPJ inválido'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  description: z.string().optional(),
  logoUrl: z.string().url('URL de logo inválida').optional().or(z.literal('')),
  address: z.string().min(3, 'Endereço inválido'),
  city: z.string().min(2, 'Cidade inválida'),
  state: z.string().min(2, 'Estado inválido'),
  zipCode: z.string().min(5, 'CEP inválido'),
  specialties: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  admin: z
    .object({
      name: z.string().min(3, 'Nome do admin deve ter ao menos 3 caracteres'),
      email: z.string().email('E-mail do admin inválido'),
      password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
    })
    .optional(),
});

export const updateClinicSchema = createClinicSchema.omit({ admin: true }).partial();

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
