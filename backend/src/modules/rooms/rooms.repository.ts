import { Prisma, Room } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export interface IRoomsRepository {
  findAll(): Promise<Room[]>;
  findById(id: string): Promise<Room | null>;
  create(data: Prisma.RoomCreateInput): Promise<Room>;
  update(id: string, data: Prisma.RoomUpdateInput): Promise<Room>;
  delete(id: string): Promise<void>;
}

export class RoomsRepository implements IRoomsRepository {
  async findAll(): Promise<Room[]> {
    return prisma.room.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<Room | null> {
    return prisma.room.findUnique({ where: { id } });
  }

  async create(data: Prisma.RoomCreateInput): Promise<Room> {
    return prisma.room.create({ data });
  }

  async update(id: string, data: Prisma.RoomUpdateInput): Promise<Room> {
    return prisma.room.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.room.delete({ where: { id } });
  }
}
