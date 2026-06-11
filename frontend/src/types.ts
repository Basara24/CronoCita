export type Role = 'ADMIN' | 'SECRETARY' | 'PROFESSIONAL' | 'PATIENT';

export type ResourceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELED' | 'FINISHED' | 'NO_SHOW';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface User extends AuthUser {
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  commissionPercentage: string | number;
  phone: string;
  email: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string | null;
  capacity: number;
  status: ResourceStatus;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string | null;
  status: ResourceStatus;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: string | number;
  requiresRoom: boolean;
  equipments: { equipment: Equipment }[];
}

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  serviceId: string;
  roomId?: string | null;
  equipmentId?: string | null;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  rating?: number | null;
  notes?: string | null;
  patient: Patient;
  professional: Professional;
  service: Service;
  room?: Room | null;
  equipment?: Equipment | null;
}

export interface Commission {
  id: string;
  appointmentId: string;
  professionalId: string;
  totalValue: string | number;
  percentage: string | number;
  professionalValue: string | number;
  clinicValue: string | number;
  createdAt: string;
  professional: Professional;
  appointment: Appointment & { service: Service; patient: Patient };
}

export interface CommissionSummary {
  professionalId: string;
  professionalName: string;
  specialty: string;
  appointmentsCount: number;
  totalValue: number;
  professionalValue: number;
  clinicValue: number;
}

export interface DashboardKpis {
  avgBookingLeadHours: number;
  occupancyRate: number;
  noShowRate: number;
  cancellationRate: number;
  patientSatisfaction: number;
  totalAppointments: number;
  totalRevenue: number;
  clinicRevenue: number;
  professionalsRevenue: number;
}

export interface DashboardCharts {
  appointmentsPerDay: { date: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  revenueByProfessional: { name: string; professionalValue: number; clinicValue: number }[];
}
