import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres').optional(),
  phone: z.string().min(8, 'Telefone inválido').optional(),
  address: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres'),
});
