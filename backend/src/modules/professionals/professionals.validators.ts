import { z } from 'zod';

export const createProfessionalSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  specialty: z.string().min(2, 'Especialidade é obrigatória'),
  commissionPercentage: z
    .number({ invalid_type_error: 'Percentual de comissão deve ser numérico' })
    .min(0, 'Percentual mínimo é 0')
    .max(100, 'Percentual máximo é 100'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
});

export const updateProfessionalSchema = createProfessionalSchema.partial();
