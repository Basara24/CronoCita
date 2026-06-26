import { z } from 'zod';

export const sendMessageSchema = z
  .object({
    receiverId: z.string().uuid('Destinatário inválido'),
    content: z.string().max(2000, 'Mensagem muito longa').optional().default(''),
    appointmentId: z.string().uuid().optional(),
    attachmentUrl: z.string().optional(),
    isImportant: z.boolean().optional(),
  })
  .refine((d) => (d.content && d.content.trim().length > 0) || d.attachmentUrl, {
    message: 'Envie um texto ou um anexo',
    path: ['content'],
  });

export const toggleImportantSchema = z.object({
  isImportant: z.boolean(),
});
