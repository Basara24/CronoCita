import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiverId: z.string().uuid('Destinatário inválido'),
  content: z.string().min(1, 'Mensagem vazia').max(2000, 'Mensagem muito longa'),
  appointmentId: z.string().uuid().optional(),
});
