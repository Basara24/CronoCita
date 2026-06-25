import { Appointment, Commission, Professional } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export interface IDashboardRepository {
  findAppointmentsInPeriod(clinicId: string, from: Date, to: Date): Promise<Appointment[]>;
  findCommissionsInPeriod(
    clinicId: string,
    from: Date,
    to: Date,
  ): Promise<(Commission & { professional: Professional })[]>;
  countActiveProfessionals(clinicId: string): Promise<number>;
}

export class DashboardRepository implements IDashboardRepository {
  async findAppointmentsInPeriod(clinicId: string, from: Date, to: Date): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: { clinicId, startsAt: { gte: from, lte: to } },
    });
  }

  async findCommissionsInPeriod(
    clinicId: string,
    from: Date,
    to: Date,
  ): Promise<(Commission & { professional: Professional })[]> {
    return prisma.commission.findMany({
      where: { clinicId, createdAt: { gte: from, lte: to } },
      include: { professional: true },
    });
  }

  async countActiveProfessionals(clinicId: string): Promise<number> {
    return prisma.professional.count({ where: { clinicId } });
  }
}
