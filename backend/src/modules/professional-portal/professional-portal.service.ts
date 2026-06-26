import { Prisma, ResourceStatus } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { AppError, ForbiddenError, NotFoundError } from '../../shared/errors/AppError';
import { addMinutes } from '../../shared/utils/date';
import { userNotificationService } from '../notifications/userNotification.service';

const appointmentInclude = {
  patient: { select: { id: true, name: true, phone: true, userId: true } },
  service: { select: { id: true, name: true, durationMinutes: true, price: true } },
  room: { select: { id: true, name: true } },
} satisfies Prisma.AppointmentInclude;

interface ServiceInput {
  name?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  imageUrl?: string;
  requiresRoom?: boolean;
  status?: ResourceStatus;
}

interface ProfileInput {
  name?: string;
  phone?: string;
  specialty?: string;
  avatarUrl?: string;
}

export class ProfessionalPortalService {
  /** Resolve o profissional logado a partir do userId (lança se não houver vínculo). */
  private async resolve(userId: string) {
    const professional = await prisma.professional.findUnique({ where: { userId } });
    if (!professional) throw new ForbiddenError('Usuário não está vinculado a um profissional');
    return professional;
  }

  async dashboard(userId: string) {
    const professional = await this.resolve(userId);
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const [todayAppointments, attendedPatients, upcoming, ratingAgg] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          professionalId: professional.id,
          startsAt: { gte: dayStart, lte: dayEnd },
          status: { not: 'CANCELED' },
        },
        orderBy: { startsAt: 'asc' },
        include: appointmentInclude,
      }),
      prisma.appointment
        .findMany({
          where: { professionalId: professional.id, status: 'FINISHED' },
          select: { patientId: true },
          distinct: ['patientId'],
        })
        .then((rows) => rows.length),
      prisma.appointment.count({
        where: {
          professionalId: professional.id,
          startsAt: { gt: now },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      prisma.appointment.aggregate({
        where: { professionalId: professional.id, status: 'FINISHED', rating: { not: null } },
        _avg: { rating: true },
      }),
    ]);

    return {
      professional: { id: professional.id, name: professional.name, specialty: professional.specialty },
      todayCount: todayAppointments.length,
      todayAppointments,
      attendedPatients,
      upcomingCount: upcoming,
      averageRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(2)) : null,
    };
  }

  async listAppointments(userId: string, opts: { from?: Date; to?: Date }) {
    const professional = await this.resolve(userId);
    return prisma.appointment.findMany({
      where: {
        professionalId: professional.id,
        startsAt: opts.from || opts.to ? { gte: opts.from, lte: opts.to } : undefined,
      },
      orderBy: { startsAt: 'asc' },
      include: appointmentInclude,
    });
  }

  private async ownAppointment(professionalId: string, id: string) {
    const appointment = await prisma.appointment.findFirst({
      where: { id, professionalId },
      include: appointmentInclude,
    });
    if (!appointment) throw new NotFoundError('Agendamento não encontrado');
    return appointment;
  }

  async cancelAppointment(userId: string, id: string) {
    const professional = await this.resolve(userId);
    const appointment = await this.ownAppointment(professional.id, id);

    if (appointment.status === 'CANCELED' || appointment.status === 'FINISHED') {
      throw new AppError('Este agendamento não pode ser cancelado');
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELED' },
      include: appointmentInclude,
    });

    if (appointment.patient.userId) {
      await userNotificationService.create({
        userId: appointment.patient.userId,
        title: 'Consulta cancelada',
        message: `❌ Sua consulta de ${appointment.service.name} com ${professional.name} foi cancelada.`,
        type: 'APPOINTMENT',
        appointmentId: appointment.id,
      });
    }

    return updated;
  }

  async rescheduleAppointment(userId: string, id: string, startsAtISO: string) {
    const professional = await this.resolve(userId);
    const appointment = await this.ownAppointment(professional.id, id);

    if (appointment.status === 'CANCELED' || appointment.status === 'FINISHED') {
      throw new AppError('Não é possível remarcar um agendamento cancelado ou finalizado');
    }

    const startsAt = new Date(startsAtISO);
    const endsAt = addMinutes(startsAt, appointment.service.durationMinutes);

    // Conflito com outros agendamentos do profissional
    const conflict = await prisma.appointment.findFirst({
      where: {
        professionalId: professional.id,
        id: { not: id },
        status: { not: 'CANCELED' },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (conflict) throw new AppError('Horário indisponível na sua agenda', 409);

    const block = await prisma.scheduleBlock.findFirst({
      where: { professionalId: professional.id, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    });
    if (block) throw new AppError('Horário bloqueado na sua agenda', 409);

    const updated = await prisma.appointment.update({
      where: { id },
      data: { startsAt, endsAt },
      include: appointmentInclude,
    });

    if (appointment.patient.userId) {
      await userNotificationService.create({
        userId: appointment.patient.userId,
        title: 'Consulta remarcada',
        message: `⚠️ Sua consulta de ${appointment.service.name} foi remarcada para ${startsAt.toLocaleString('pt-BR')}.`,
        type: 'APPOINTMENT',
        appointmentId: appointment.id,
      });
    }

    return updated;
  }

  // ---- Bloqueios de agenda ----
  async listBlocks(userId: string, opts: { from?: Date; to?: Date }) {
    const professional = await this.resolve(userId);
    return prisma.scheduleBlock.findMany({
      where: {
        professionalId: professional.id,
        startsAt: opts.from || opts.to ? { gte: opts.from, lte: opts.to } : undefined,
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async createBlock(userId: string, data: { startsAt: string; endsAt: string; reason?: string }) {
    const professional = await this.resolve(userId);
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    const conflict = await prisma.appointment.findFirst({
      where: {
        professionalId: professional.id,
        status: { not: 'CANCELED' },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
    if (conflict) {
      throw new AppError('Já existe um agendamento neste período. Remarque-o antes de bloquear.', 409);
    }

    return prisma.scheduleBlock.create({
      data: { professionalId: professional.id, clinicId: professional.clinicId, startsAt, endsAt, reason: data.reason },
    });
  }

  async removeBlock(userId: string, id: string): Promise<void> {
    const professional = await this.resolve(userId);
    const block = await prisma.scheduleBlock.findFirst({ where: { id, professionalId: professional.id } });
    if (!block) throw new NotFoundError('Bloqueio não encontrado');
    await prisma.scheduleBlock.delete({ where: { id } });
  }

  // ---- Serviços próprios ----
  async listServices(userId: string) {
    const professional = await this.resolve(userId);
    return prisma.service.findMany({
      where: { professionalId: professional.id },
      orderBy: { name: 'asc' },
    });
  }

  async createService(userId: string, data: ServiceInput) {
    const professional = await this.resolve(userId);
    return prisma.service.create({
      data: {
        clinicId: professional.clinicId,
        professionalId: professional.id,
        name: data.name!,
        description: data.description || null,
        durationMinutes: data.durationMinutes!,
        price: data.price!,
        imageUrl: data.imageUrl || null,
        requiresRoom: data.requiresRoom ?? false,
        status: data.status ?? 'ACTIVE',
      },
    });
  }

  async updateService(userId: string, id: string, data: ServiceInput) {
    const professional = await this.resolve(userId);
    const service = await prisma.service.findFirst({ where: { id, professionalId: professional.id } });
    if (!service) throw new NotFoundError('Serviço não encontrado');
    return prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        durationMinutes: data.durationMinutes,
        price: data.price,
        imageUrl: data.imageUrl,
        requiresRoom: data.requiresRoom,
        status: data.status,
      },
    });
  }

  async removeService(userId: string, id: string): Promise<void> {
    const professional = await this.resolve(userId);
    const service = await prisma.service.findFirst({ where: { id, professionalId: professional.id } });
    if (!service) throw new NotFoundError('Serviço não encontrado');
    await prisma.service.delete({ where: { id } });
  }

  // ---- Pacientes atendidos ----
  async listPatients(userId: string) {
    const professional = await this.resolve(userId);
    const grouped = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: { professionalId: professional.id, status: 'FINISHED' },
      _count: { patientId: true },
      _max: { startsAt: true },
    });

    const patientIds = grouped.map((g) => g.patientId);
    if (patientIds.length === 0) return [];

    const patients = await prisma.patient.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, name: true, phone: true, email: true, userId: true },
    });

    return grouped
      .map((g) => {
        const patient = patients.find((p) => p.id === g.patientId);
        if (!patient) return null;
        return {
          ...patient,
          totalConsultations: g._count.patientId,
          lastConsultation: g._max.startsAt,
        };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .sort((a, b) => (b.lastConsultation?.getTime() ?? 0) - (a.lastConsultation?.getTime() ?? 0));
  }

  async patientHistory(userId: string, patientId: string) {
    const professional = await this.resolve(userId);
    return prisma.appointment.findMany({
      where: { professionalId: professional.id, patientId },
      orderBy: { startsAt: 'desc' },
      include: appointmentInclude,
    });
  }

  // ---- Perfil ----
  async getProfile(userId: string) {
    const professional = await this.resolve(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    const clinic = await prisma.clinic.findUnique({
      where: { id: professional.clinicId },
      select: { name: true, logoUrl: true, coverImageUrl: true },
    });
    return {
      id: professional.id,
      name: professional.name,
      specialty: professional.specialty,
      phone: professional.phone,
      email: professional.email,
      commissionPercentage: professional.commissionPercentage,
      clinicId: professional.clinicId,
      avatarUrl: user?.avatarUrl ?? null,
      clinic: clinic ?? { name: 'Clínica', logoUrl: null, coverImageUrl: null },
    };
  }

  async updateProfile(userId: string, data: ProfileInput) {
    const professional = await this.resolve(userId);
    await prisma.professional.update({
      where: { id: professional.id },
      data: { name: data.name, phone: data.phone, specialty: data.specialty },
    });
    if (data.name || data.avatarUrl !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: data.name, avatarUrl: data.avatarUrl },
      });
    }
    return this.getProfile(userId);
  }

  /** Indica se o paciente (por userId) possui vínculo elegível para mensagens. */
  async hasPatientLink(professionalUserId: string, patientUserId: string): Promise<boolean> {
    const professional = await this.resolve(professionalUserId);
    const count = await prisma.appointment.count({
      where: {
        professionalId: professional.id,
        status: { not: 'CANCELED' },
        patient: { userId: patientUserId },
      },
    });
    return count > 0;
  }

  /** @deprecated Use hasPatientLink */
  async hasAttended(professionalUserId: string, patientUserId: string): Promise<boolean> {
    return this.hasPatientLink(professionalUserId, patientUserId);
  }

  /** Pacientes elegíveis para iniciar conversa (com conta de usuário). */
  async listMessagingContacts(userId: string, search?: string) {
    const professional = await this.resolve(userId);
    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        professionalId: professional.id,
        status: { not: 'CANCELED' },
        patient: { userId: { not: null } },
      },
      select: {
        startsAt: true,
        status: true,
        patient: {
          select: {
            userId: true,
            name: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

    const byUser = new Map<
      string,
      {
        userId: string;
        name: string;
        avatarUrl: string | null;
        nextAppointment: Date | null;
        lastAttendance: Date | null;
      }
    >();

    for (const appt of appointments) {
      const uid = appt.patient.userId!;
      const existing = byUser.get(uid) ?? {
        userId: uid,
        name: appt.patient.user?.name ?? appt.patient.name,
        avatarUrl: appt.patient.user?.avatarUrl ?? null,
        nextAppointment: null,
        lastAttendance: null,
      };

      if (
        (appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED') &&
        appt.startsAt >= now &&
        (!existing.nextAppointment || appt.startsAt < existing.nextAppointment)
      ) {
        existing.nextAppointment = appt.startsAt;
      }

      if (
        appt.status === 'FINISHED' &&
        (!existing.lastAttendance || appt.startsAt > existing.lastAttendance)
      ) {
        existing.lastAttendance = appt.startsAt;
      }

      byUser.set(uid, existing);
    }

    let contacts = Array.from(byUser.values());

    if (search?.trim()) {
      const q = search.trim().toLowerCase();
      contacts = contacts.filter((c) => c.name.toLowerCase().includes(q));
    }

    return contacts.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
}

export const professionalPortalService = new ProfessionalPortalService();
