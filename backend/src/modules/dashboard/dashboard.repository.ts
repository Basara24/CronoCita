import { Appointment, Commission, Professional } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export interface IDashboardRepository {
  findAppointmentsInPeriod(from: Date, to: Date): Promise<Appointment[]>;
  findCommissionsInPeriod(
    from: Date,
    to: Date,
  ): Promise<(Commission & { professional: Professional })[]>;
  countActiveProfessionals(): Promise<number>;
}

export class DashboardRepository implements IDashboardRepository {
  async findAppointmentsInPeriod(from: Date, to: Date): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: { startsAt: { gte: from, lte: to } },
    });
  }

  async findCommissionsInPeriod(
    from: Date,
    to: Date,
  ): Promise<(Commission & { professional: Professional })[]> {
    return prisma.commission.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { professional: true },
    });
  }

  async countActiveProfessionals(): Promise<number> {
    return prisma.professional.count();
  }
}
