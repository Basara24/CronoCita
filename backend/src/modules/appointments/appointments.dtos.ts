import { AppointmentStatus } from '@prisma/client';

export interface CreateAppointmentDTO {
  patientId: string;
  professionalId: string;
  serviceId: string;
  roomId?: string;
  equipmentId?: string;
  startsAt: string;
  notes?: string;
}

export interface RescheduleAppointmentDTO {
  startsAt: string;
  roomId?: string;
  equipmentId?: string;
}

export interface UpdateStatusDTO {
  status: AppointmentStatus;
  rating?: number;
}

export interface ListAppointmentsFilterDTO {
  from?: Date;
  to?: Date;
  professionalId?: string;
  patientId?: string;
  status?: AppointmentStatus;
}

export interface AvailabilityCheckDTO {
  professionalId: string;
  roomId?: string | null;
  equipmentId?: string | null;
  startsAt: Date;
  endsAt: Date;
  excludeAppointmentId?: string;
}

export interface PublicBookingDTO {
  professionalId: string;
  serviceId: string;
  startsAt: string;
  patient: {
    name: string;
    cpf: string;
    email: string;
    phone: string;
    birthDate?: string;
  };
}
