import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export type ServiceWithEquipments = Prisma.ServiceGetPayload<{
  include: { equipments: { include: { equipment: true } } };
}>;

export interface IServicesRepository {
  findAll(): Promise<ServiceWithEquipments[]>;
  findById(id: string): Promise<ServiceWithEquipments | null>;
  create(data: {
    name: string;
    durationMinutes: number;
    price: number;
    requiresRoom?: boolean;
    equipmentIds?: string[];
  }): Promise<ServiceWithEquipments>;
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
}

const includeEquipments = { equipments: { include: { equipment: true } } } as const;

export class ServicesRepository implements IServicesRepository {
  async findAll(): Promise<ServiceWithEquipments[]> {
    return prisma.service.findMany({ include: includeEquipments, orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<ServiceWithEquipments | null> {
    return prisma.service.findUnique({ where: { id }, include: includeEquipments });
  }

  async create(data: {
    name: string;
    durationMinutes: number;
    price: number;
    requiresRoom?: boolean;
    equipmentIds?: string[];
  }): Promise<ServiceWithEquipments> {
    const { equipmentIds, ...rest } = data;
    return prisma.service.create({
      data: {
        ...rest,
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
}
