import { Room } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { CreateRoomDTO, UpdateRoomDTO } from './rooms.dtos';

export interface IRoomsRepository {
  findAll(clinicId: string): Promise<Room[]>;
  findById(clinicId: string, id: string): Promise<Room | null>;
  create(clinicId: string, data: CreateRoomDTO): Promise<Room>;
  update(id: string, data: UpdateRoomDTO): Promise<Room>;
  delete(id: string): Promise<void>;
}

export class RoomsRepository implements IRoomsRepository {
  async findAll(clinicId: string): Promise<Room[]> {
    return prisma.room.findMany({ where: { clinicId }, orderBy: { name: 'asc' } });
  }

  async findById(clinicId: string, id: string): Promise<Room | null> {
    return prisma.room.findFirst({ where: { id, clinicId } });
  }

  async create(clinicId: string, data: CreateRoomDTO): Promise<Room> {
    return prisma.room.create({ data: { ...data, clinicId } });
  }

  async update(id: string, data: UpdateRoomDTO): Promise<Room> {
    return prisma.room.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.room.delete({ where: { id } });
  }
}
