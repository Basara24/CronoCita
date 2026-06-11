import { z } from 'zod';

export const createEquipmentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();
