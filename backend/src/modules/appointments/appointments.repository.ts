import { Appointment, Equipment, Prisma, Room } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import {
  AvailabilityCheckDTO,
  ListAppointmentsFilterDTO,
} from './appointments.dtos';

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: {
    patient: true;
    professional: true;
    service: true;
    room: true;
    equipment: true;
  };
}>;

const fullInclude = {
  patient: true,
  professional: true,
  service: true,
  room: true,
  equipment: true,
} as const;

export interface IAppointmentsRepository {
  findMany(filter: ListAppointmentsFilterDTO): Promise<AppointmentWithRelations[]>;
  findById(clinicId: string, id: string): Promise<AppointmentWithRelations | null>;
  /**
   * Retorna agendamentos ativos (não cancelados) que se sobrepõem ao intervalo
   * e disputam o mesmo profissional, sala ou equipamento (dentro da clínica).
   */
  findConflicts(input: AvailabilityCheckDTO): Promise<Appointment[]>;
  countScheduleBlocks(professionalId: string, startsAt: Date, endsAt: Date): Promise<number>;
  create(clinicId: string, data: Prisma.AppointmentUncheckedCreateInput): Promise<AppointmentWithRelations>;
  update(id: string, data: Prisma.AppointmentUncheckedUpdateInput): Promise<AppointmentWithRelations>;
  findFreeRoom(clinicId: string, startsAt: Date, endsAt: Date): Promise<Room | null>;
  findFreeEquipment(
    clinicId: string,
    equipmentIds: string[],
    startsAt: Date,
    endsAt: Date,
  ): Promise<Equipment | null>;
}

export class AppointmentsRepository implements IAppointmentsRepository {
  async findMany(filter: ListAppointmentsFilterDTO): Promise<AppointmentWithRelations[]> {
    return prisma.appointment.findMany({
      where: {
        clinicId: filter.clinicId,
        startsAt: filter.from || filter.to ? { gte: filter.from, lte: filter.to } : undefined,
        professionalId: filter.professionalId,
        patientId: filter.patientId,
        status: filter.status,
      },
      include: fullInclude,
      orderBy: { startsAt: 'asc' },
    });
  }

  async findById(clinicId: string, id: string): Promise<AppointmentWithRelations | null> {
    return prisma.appointment.findFirst({ where: { id, clinicId }, include: fullInclude });
  }

  async findConflicts(input: AvailabilityCheckDTO): Promise<Appointment[]> {
    const resourceFilters: Prisma.AppointmentWhereInput[] = [
      { professionalId: input.professionalId },
    ];
    if (input.roomId) resourceFilters.push({ roomId: input.roomId });
    if (input.equipmentId) resourceFilters.push({ equipmentId: input.equipmentId });

    return prisma.appointment.findMany({
      where: {
        clinicId: input.clinicId,
        id: input.excludeAppointmentId ? { not: input.excludeAppointmentId } : undefined,
        status: { not: 'CANCELED' },
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
        OR: resourceFilters,
      },
    });
  }

  async countScheduleBlocks(professionalId: string, startsAt: Date, endsAt: Date): Promise<number> {
    return prisma.scheduleBlock.count({
      where: {
        professionalId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });
  }

  async create(
    clinicId: string,
    data: Prisma.AppointmentUncheckedCreateInput,
  ): Promise<AppointmentWithRelations> {
    return prisma.appointment.create({ data: { ...data, clinicId }, include: fullInclude });
  }

  async update(
    id: string,
    data: Prisma.AppointmentUncheckedUpdateInput,
  ): Promise<AppointmentWithRelations> {
    return prisma.appointment.update({ where: { id }, data, include: fullInclude });
  }

  async findFreeRoom(clinicId: string, startsAt: Date, endsAt: Date): Promise<Room | null> {
    return prisma.room.findFirst({
      where: {
        clinicId,
        status: 'ACTIVE',
        appointments: {
          none: {
            status: { not: 'CANCELED' },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findFreeEquipment(
    clinicId: string,
    equipmentIds: string[],
    startsAt: Date,
    endsAt: Date,
  ): Promise<Equipment | null> {
    if (equipmentIds.length === 0) return null;
    return prisma.equipment.findFirst({
      where: {
        clinicId,
        id: { in: equipmentIds },
        status: 'ACTIVE',
        appointments: {
          none: {
            status: { not: 'CANCELED' },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        },
      },
    });
  }
}
