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

const optionalUrl = z.string().url('URL inválida').optional().or(z.literal(''));

/** Edição da própria clínica pelo CLINIC_ADMIN (identidade visual, social, localização). */
export const updateOwnClinicSchema = z.object({
  name: z.string().min(2, 'Nome inválido').optional(),
  description: z.string().optional(),
  phone: z.string().min(8, 'Telefone inválido').optional(),
  email: z.string().email('E-mail inválido').optional(),
  logoUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  website: optionalUrl,
  instagram: optionalUrl,
  facebook: optionalUrl,
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const addPhotoSchema = z.object({
  url: z.string().min(1, 'URL obrigatória'),
  category: z.enum(['RECEPTION', 'CONSULTORIO', 'EQUIPMENT', 'TEAM', 'FACADE', 'OTHER']).optional(),
  caption: z.string().optional(),
});
