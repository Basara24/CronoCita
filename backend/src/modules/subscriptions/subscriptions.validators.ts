import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  clinicId: z.string().uuid('clinicId inválido'),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED']).optional(),
  price: z.number().nonnegative('Preço inválido'),
  startsAt: z.string().optional(),
  renewsAt: z.string().optional(),
});

export const updateSubscriptionSchema = z.object({
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).optional(),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED']).optional(),
  price: z.number().nonnegative('Preço inválido').optional(),
  startsAt: z.string().optional(),
  renewsAt: z.string().optional(),
});
