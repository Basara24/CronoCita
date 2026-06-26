import { z } from 'zod';
import { zCpf, zPhone } from '../../shared/validators/zodBr';

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Data/hora inválida');

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Paciente inválido'),
  professionalId: z.string().uuid('Profissional inválido'),
  serviceId: z.string().uuid('Serviço inválido'),
  roomId: z.string().uuid().optional(),
  equipmentId: z.string().uuid().optional(),
  startsAt: isoDate,
  notes: z.string().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  startsAt: isoDate,
  roomId: z.string().uuid().optional(),
  equipmentId: z.string().uuid().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELED', 'FINISHED', 'NO_SHOW']),
  rating: z.number().int().min(1).max(5).optional(),
});

export const publicBookingSchema = z.object({
  professionalId: z.string().uuid('Profissional inválido'),
  serviceId: z.string().uuid('Serviço inválido'),
  startsAt: isoDate,
  patient: z.object({
    name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
    cpf: zCpf(),
    email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
    phone: zPhone(),
    birthDate: z.string().optional(),
  }),
});
