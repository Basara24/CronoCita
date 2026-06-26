import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  subject: z.string().min(3, 'Assunto deve ter ao menos 3 caracteres'),
  message: z.string().min(10, 'Mensagem deve ter ao menos 10 caracteres'),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'RESOLVED']),
});

export type CreateContactDTO = z.infer<typeof createContactSchema>;
