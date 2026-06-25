import { Equipment } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from './equipments.dtos';

export interface IEquipmentsRepository {
  findAll(clinicId: string): Promise<Equipment[]>;
  findById(clinicId: string, id: string): Promise<Equipment | null>;
  create(clinicId: string, data: CreateEquipmentDTO): Promise<Equipment>;
  update(id: string, data: UpdateEquipmentDTO): Promise<Equipment>;
  delete(id: string): Promise<void>;
}

export class EquipmentsRepository implements IEquipmentsRepository {
  async findAll(clinicId: string): Promise<Equipment[]> {
    return prisma.equipment.findMany({ where: { clinicId }, orderBy: { name: 'asc' } });
  }

  async findById(clinicId: string, id: string): Promise<Equipment | null> {
    return prisma.equipment.findFirst({ where: { id, clinicId } });
  }

  async create(clinicId: string, data: CreateEquipmentDTO): Promise<Equipment> {
    return prisma.equipment.create({ data: { ...data, clinicId } });
  }

  async update(id: string, data: UpdateEquipmentDTO): Promise<Equipment> {
    return prisma.equipment.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.equipment.delete({ where: { id } });
  }
}
