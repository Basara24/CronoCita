import { z } from 'zod';

export const createBlockSchema = z
  .object({
    startsAt: z.string().datetime({ message: 'Data/hora inicial inválida' }),
    endsAt: z.string().datetime({ message: 'Data/hora final inválida' }),
    reason: z.string().optional(),
  })
  .refine((d) => new Date(d.endsAt) > new Date(d.startsAt), {
    message: 'O término deve ser após o início',
    path: ['endsAt'],
  });

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome inválido'),
  description: z.string().optional(),
  durationMinutes: z.number().int().positive('Duração inválida'),
  price: z.number().nonnegative('Preço inválido'),
  imageUrl: z.string().optional(),
  requiresRoom: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const rescheduleSchema = z.object({
  startsAt: z.string().datetime({ message: 'Data/hora inválida' }),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  specialty: z.string().min(2).optional(),
  avatarUrl: z.string().optional(),
});
