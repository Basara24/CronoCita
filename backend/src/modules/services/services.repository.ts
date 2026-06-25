import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export type ServiceWithEquipments = Prisma.ServiceGetPayload<{
  include: { equipments: { include: { equipment: true } } };
}>;

export interface IServicesRepository {
  findAll(clinicId: string): Promise<ServiceWithEquipments[]>;
  findById(clinicId: string, id: string): Promise<ServiceWithEquipments | null>;
  create(
    clinicId: string,
    data: {
      name: string;
      durationMinutes: number;
      price: number;
      requiresRoom?: boolean;
      equipmentIds?: string[];
    },
  ): Promise<ServiceWithEquipments>;
  update(
    id: string,
    data: {
      name?: string;
      durationMinutes?: number;
      price?: number;
      requiresRoom?: boolean;
      equipmentIds?: string[];
    },
  ): Promise<ServiceWithEquipments>;
  delete(id: string): Promise<void>;
  countEquipmentsInClinic(clinicId: string, equipmentIds: string[]): Promise<number>;
}

const includeEquipments = { equipments: { include: { equipment: true } } } as const;

export class ServicesRepository implements IServicesRepository {
  async findAll(clinicId: string): Promise<ServiceWithEquipments[]> {
    return prisma.service.findMany({ where: { clinicId }, include: includeEquipments, orderBy: { name: 'asc' } });
  }

  async findById(clinicId: string, id: string): Promise<ServiceWithEquipments | null> {
    return prisma.service.findFirst({ where: { id, clinicId }, include: includeEquipments });
  }

  async create(
    clinicId: string,
    data: {
      name: string;
      durationMinutes: number;
      price: number;
      requiresRoom?: boolean;
      equipmentIds?: string[];
    },
  ): Promise<ServiceWithEquipments> {
    const { equipmentIds, ...rest } = data;
    return prisma.service.create({
      data: {
        ...rest,
        clinicId,
        equipments: equipmentIds?.length
          ? { create: equipmentIds.map((equipmentId) => ({ equipmentId })) }
          : undefined,
      },
      include: includeEquipments,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      durationMinutes?: number;
      price?: number;
      requiresRoom?: boolean;
      equipmentIds?: string[];
    },
  ): Promise<ServiceWithEquipments> {
    const { equipmentIds, ...rest } = data;
    return prisma.service.update({
      where: { id },
      data: {
        ...rest,
        equipments: equipmentIds
          ? {
              deleteMany: {},
              create: equipmentIds.map((equipmentId) => ({ equipmentId })),
            }
          : undefined,
      },
      include: includeEquipments,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.service.delete({ where: { id } });
  }

  async countEquipmentsInClinic(clinicId: string, equipmentIds: string[]): Promise<number> {
    return prisma.equipment.count({ where: { clinicId, id: { in: equipmentIds } } });
  }
}
