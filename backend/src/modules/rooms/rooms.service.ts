import { Room } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/AppError';
import { IRoomsRepository } from './rooms.repository';
import { CreateRoomDTO, UpdateRoomDTO } from './rooms.dtos';

export class RoomsService {
  constructor(private readonly repository: IRoomsRepository) {}

  async list(clinicId: string): Promise<Room[]> {
    return this.repository.findAll(clinicId);
  }

  async getById(clinicId: string, id: string): Promise<Room> {
    const room = await this.repository.findById(clinicId, id);
    if (!room) throw new NotFoundError('Sala não encontrada');
    return room;
  }

  async create(clinicId: string, data: CreateRoomDTO): Promise<Room> {
    return this.repository.create(clinicId, data);
  }

  async update(clinicId: string, id: string, data: UpdateRoomDTO): Promise<Room> {
    await this.getById(clinicId, id);
    return this.repository.update(id, data);
  }

  async delete(clinicId: string, id: string): Promise<void> {
    await this.getById(clinicId, id);
    await this.repository.delete(id);
  }
}
