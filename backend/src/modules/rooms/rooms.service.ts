import { Room } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/AppError';
import { IRoomsRepository } from './rooms.repository';
import { CreateRoomDTO, UpdateRoomDTO } from './rooms.dtos';

export class RoomsService {
  constructor(private readonly repository: IRoomsRepository) {}

  async list(): Promise<Room[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Room> {
    const room = await this.repository.findById(id);
    if (!room) throw new NotFoundError('Sala não encontrada');
    return room;
  }

  async create(data: CreateRoomDTO): Promise<Room> {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateRoomDTO): Promise<Room> {
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
