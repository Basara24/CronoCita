export type Role = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'SECRETARY' | 'PROFESSIONAL' | 'PATIENT';

export type ResourceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELED' | 'FINISHED' | 'NO_SHOW';

export type ClinicStatus = 'ACTIVE' | 'INACTIVE';

export type SubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

export const SPECIALTY_OPTIONS = [
  'Fisioterapia',
  'Nutrição',
  'Psicologia',
  'Odontologia',
  'Estética',
  'Cardiologia',
  'Dermatologia',
] as const;

export type NotificationType = 'APPOINTMENT' | 'REMINDER' | 'CHAT' | 'PROMOTION' | 'SYSTEM';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId?: string | null;
  clinicSlug?: string | null;
  cpf?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  appointmentId?: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  appointmentId?: string | null;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

export interface ChatThread {
  user: { id: string; name: string; role: Role; avatarUrl?: string | null };
  lastMessage: string;
  lastAt: string;
  unread: number;
}

export interface PatientAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  rating?: number | null;
  clinic: { id: string; name: string; slug: string; city: string; phone: string };
  professional: { id: string; name: string; specialty: string };
  service: { id: string; name: string; price: string | number; durationMinutes: number };
}

export interface PatientDashboard {
  nextAppointment: PatientAppointment | null;
  completedCount: number;
  clinicsVisited: number;
  unreadNotifications: number;
  favoritesCount: number;
}

export interface FavoriteClinic {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  rating?: string | number | null;
  specialties: string[];
  favoritedAt?: string;
}

export interface FeaturedClinics {
  popular: FavoriteClinic[];
  topRated: FavoriteClinic[];
  nearby: FavoriteClinic[];
}

export type ClinicPhotoCategory = 'RECEPTION' | 'CONSULTORIO' | 'EQUIPMENT' | 'TEAM' | 'FACADE' | 'OTHER';

export interface ClinicPhoto {
  id: string;
  url: string;
  category: ClinicPhotoCategory;
  caption?: string | null;
}

export interface ClinicSelf {
  id: string;
  name: string;
  description?: string | null;
  phone: string;
  email: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  specialties: { specialty: string }[];
  photos: ClinicPhoto[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'NEW' | 'READ' | 'RESOLVED';
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  professionalId: string;
  clinicId: string;
  startsAt: string;
  endsAt: string;
  reason?: string | null;
  createdAt: string;
}

export interface ProfessionalDashboard {
  professional: { id: string; name: string; specialty: string };
  todayCount: number;
  todayAppointments: ProfessionalAppointment[];
  attendedPatients: number;
  upcomingCount: number;
  averageRating: number | null;
}

export interface ProfessionalAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  rating?: number | null;
  patient: { id: string; name: string; phone: string; userId?: string | null };
  service: { id: string; name: string; durationMinutes: number; price: string | number };
  room?: { id: string; name: string } | null;
}

export interface ProfessionalPatient {
  id: string;
  name: string;
  phone: string;
  email: string;
  userId?: string | null;
  totalConsultations: number;
  lastConsultation: string | null;
}

export interface ProfessionalService {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: string | number;
  imageUrl?: string | null;
  requiresRoom: boolean;
  status: ResourceStatus;
}

export interface ProfessionalProfile {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  commissionPercentage: string | number;
  clinicId: string;
  avatarUrl?: string | null;
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  avatarUrl: string | null;
  address: string | null;
}

export interface User extends AuthUser {
  createdAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  cnpj: string;
  email: string;
  phone: string;
  description?: string | null;
  logoUrl?: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: ClinicStatus;
  createdAt: string;
  updatedAt: string;
  specialties: { clinicId: string; specialty: string }[];
  subscription?: Subscription | null;
  _count?: { professionals: number; appointments: number };
}

export interface Subscription {
  id: string;
  clinicId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  price: string | number;
  startsAt: string;
  renewsAt?: string | null;
  createdAt: string;
  clinic?: { id: string; name: string; slug: string; city: string };
}

export interface PlatformMetrics {
  totalClinics: number;
  activeClinics: number;
  inactiveClinics: number;
  totalProfessionals: number;
  totalPatients: number;
  totalAppointments: number;
  aggregatedRevenue: number;
  activeSubscriptions: number;
  clinicsByCity: { city: string; count: number }[];
  appointmentsByClinic: { clinicId: string; name: string; count: number }[];
}

export interface PublicClinicSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  rating?: string | number | null;
  description?: string | null;
  specialties: string[];
}

export interface PublicClinicDetail extends PublicClinicSummary {
  phone: string;
  email: string;
  address: string;
  zipCode: string;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  photos: ClinicPhoto[];
  professionals: { id: string; name: string; specialty: string }[];
  services: {
    id: string;
    name: string;
    description?: string | null;
    durationMinutes: number;
    price: string | number;
    imageUrl?: string | null;
    professionalId?: string | null;
  }[];
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
