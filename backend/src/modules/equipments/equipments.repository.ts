import { Equipment, Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export interface IEquipmentsRepository {
  findAll(): Promise<Equipment[]>;
  findById(id: string): Promise<Equipment | null>;
  create(data: Prisma.EquipmentCreateInput): Promise<Equipment>;
  update(id: string, data: Prisma.EquipmentUpdateInput): Promise<Equipment>;
  delete(id: string): Promise<void>;
}

export class EquipmentsRepository implements IEquipmentsRepository {
  async findAll(): Promise<Equipment[]> {
    return prisma.equipment.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<Equipment | null> {
    return prisma.equipment.findUnique({ where: { id } });
  }

  async create(data: Prisma.EquipmentCreateInput): Promise<Equipment> {
    return prisma.equipment.create({ data });
  }

  async update(id: string, data: Prisma.EquipmentUpdateInput): Promise<Equipment> {
    return prisma.equipment.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.equipment.delete({ where: { id } });
  }
}
