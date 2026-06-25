import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError';
import { canCancel } from '../appointments/availability';
import { makeNotificationService } from '../../shared/notifications/NotificationService';
import { userNotificationService } from '../notifications/userNotification.service';

const appointmentInclude = {
  clinic: { select: { id: true, name: true, slug: true, city: true, phone: true } },
  professional: { select: { id: true, name: true, specialty: true } },
  service: { select: { id: true, name: true, price: true, durationMinutes: true } },
} satisfies Prisma.AppointmentInclude;

type Scope = 'upcoming' | 'history';
type Period = 'today' | 'week' | 'month' | 'all';

interface ListFilters {
  scope: Scope;
  period?: Period;
  search?: string;
  clinicId?: string;
}

interface ProfileUpdate {
  name?: string;
  phone?: string;
  address?: string;
}

export class PatientPortalService {
  private readonly notificationService = makeNotificationService();

  private async patientIds(userId: string): Promise<string[]> {
    const patients = await prisma.patient.findMany({ where: { userId }, select: { id: true } });
    return patients.map((p) => p.id);
  }

  private periodRange(period?: Period): { gte?: Date; lte?: Date } {
    if (!period || period === 'all') return {};
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (period === 'today') return { gte: start, lte: end };
    if (period === 'week') {
      end.setDate(end.getDate() + 7);
      return { gte: start, lte: end };
    }
    // month
    end.setMonth(end.getMonth() + 1);
    return { gte: start, lte: end };
  }

  async dashboard(userId: string) {
    const ids = await this.patientIds(userId);
    const now = new Date();

    const [nextAppointment, completedCount, patients, unread] = await Promise.all([
      ids.length
        ? prisma.appointment.findFirst({
            where: {
              patientId: { in: ids },
              startsAt: { gte: now },
              status: { in: ['SCHEDULED', 'CONFIRMED'] },
            },
            orderBy: { startsAt: 'asc' },
            include: appointmentInclude,
          })
        : null,
      ids.length
        ? prisma.appointment.count({ where: { patientId: { in: ids }, status: 'FINISHED' } })
        : 0,
      prisma.patient.findMany({ where: { userId }, select: { clinicId: true } }),
      userNotificationService.countUnread(userId),
    ]);

    const clinicsVisited = new Set(patients.map((p) => p.clinicId)).size;

    return {
      nextAppointment,
      completedCount,
      clinicsVisited,
      unreadNotifications: unread,
    };
  }

  async listAppointments(userId: string, filters: ListFilters) {
    const ids = await this.patientIds(userId);
    if (ids.length === 0) return [];

    const now = new Date();
    const where: Prisma.AppointmentWhereInput = { patientId: { in: ids } };

    if (filters.scope === 'upcoming') {
      where.startsAt = { gte: now, ...this.periodRange(filters.period) };
      where.status = { in: ['SCHEDULED', 'CONFIRMED'] };
    } else {
      where.OR = [{ startsAt: { lt: now } }, { status: { in: ['FINISHED', 'CANCELED', 'NO_SHOW'] } }];
    }

    if (filters.clinicId) where.clinicId = filters.clinicId;
    if (filters.search) {
      where.AND = [
        {
          OR: [
            { service: { name: { contains: filters.search } } },
            { professional: { name: { contains: filters.search } } },
            { clinic: { name: { contains: filters.search } } },
          ],
        },
      ];
    }

    return prisma.appointment.findMany({
      where,
      orderBy: { startsAt: filters.scope === 'upcoming' ? 'asc' : 'desc' },
      include: appointmentInclude,
    });
  }

  /** Cancela uma consulta do próprio paciente (valida posse via patient.userId). */
  async cancelAppointment(userId: string, appointmentId: string) {
    const ids = await this.patientIds(userId);
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, patientId: { in: ids } },
      include: { ...appointmentInclude, patient: { select: { name: true, phone: true } } },
    });
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');

    if (appointment.status === 'CANCELED' || appointment.status === 'FINISHED') {
      throw new AppError('Este agendamento não pode ser cancelado');
    }
    if (!canCancel(appointment.startsAt)) {
      throw new AppError('Não é permitido cancelar com menos de 2 horas de antecedência.', 422);
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELED' },
      include: appointmentInclude,
    });

    this.notificationService
      .notifyAppointmentCanceled({
        appointmentId: appointment.id,
        patientName: appointment.patient.name,
        patientPhone: appointment.patient.phone,
        serviceName: appointment.service.name,
        startsAt: appointment.startsAt,
      })
      .catch((err) => console.error('Erro ao notificar:', err));

    await userNotificationService.create({
      userId,
      title: 'Consulta cancelada',
      message: `❌ Sua consulta de ${appointment.service.name} na ${appointment.clinic.name} foi cancelada.`,
      type: 'APPOINTMENT',
      appointmentId: appointment.id,
    });

    return updated;
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, cpf: true, phone: true, avatarUrl: true },
    });
    if (!user) throw new NotFoundError('Usuário não encontrado');

    // Endereço vem do primeiro registro de paciente (se houver)
    const patient = await prisma.patient.findFirst({
      where: { userId },
      select: { address: true, city: true, state: true, zipCode: true },
    });

    return { ...user, address: patient?.address ?? null };
  }

  async updateProfile(userId: string, data: ProfileUpdate) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, phone: data.phone },
      select: { id: true, name: true, email: true, cpf: true, phone: true, avatarUrl: true },
    });

    if (data.name || data.phone || data.address) {
      await prisma.patient.updateMany({
        where: { userId },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.address ? { address: data.address } : {}),
        },
      });
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Usuário não encontrado');

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) throw new ForbiddenError('Senha atual incorreta');

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, cpf: true, phone: true, avatarUrl: true },
    });
  }
}

export const patientPortalService = new PatientPortalService();
