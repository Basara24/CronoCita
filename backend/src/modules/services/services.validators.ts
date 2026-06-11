import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  durationMinutes: z.number().int().min(5, 'Duração mínima é 5 minutos'),
  price: z.number().min(0, 'Valor não pode ser negativo'),
  requiresRoom: z.boolean().optional(),
  equipmentIds: z.array(z.string().uuid()).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();
