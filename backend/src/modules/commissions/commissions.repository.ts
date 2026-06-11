import { Commission, Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { ListCommissionsFilterDTO } from './commissions.dtos';

export type CommissionWithRelations = Prisma.CommissionGetPayload<{
  include: {
    professional: true;
    appointment: { include: { service: true; patient: true } };
  };
}>;

export interface ICommissionsRepository {
  create(data: Prisma.CommissionUncheckedCreateInput): Promise<Commission>;
  findByAppointmentId(appointmentId: string): Promise<Commission | null>;
  findMany(filter: ListCommissionsFilterDTO): Promise<CommissionWithRelations[]>;
}

export class CommissionsRepository implements ICommissionsRepository {
  async create(data: Prisma.CommissionUncheckedCreateInput): Promise<Commission> {
    return prisma.commission.create({ data });
  }

  async findByAppointmentId(appointmentId: string): Promise<Commission | null> {
    return prisma.commission.findUnique({ where: { appointmentId } });
  }

  async findMany(filter: ListCommissionsFilterDTO): Promise<CommissionWithRelations[]> {
    return prisma.commission.findMany({
      where: {
        professionalId: filter.professionalId,
        createdAt: filter.from || filter.to ? { gte: filter.from, lte: filter.to } : undefined,
      },
      include: {
        professional: true,
        appointment: { include: { service: true, patient: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
