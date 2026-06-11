import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  capacity: z.number().int().min(1, 'Capacidade mínima é 1'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

export const updateRoomSchema = createRoomSchema.partial();
