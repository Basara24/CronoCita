import { Equipment } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/AppError';
import { IEquipmentsRepository } from './equipments.repository';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from './equipments.dtos';

export class EquipmentsService {
  constructor(private readonly repository: IEquipmentsRepository) {}

  async list(): Promise<Equipment[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Equipment> {
    const equipment = await this.repository.findById(id);
    if (!equipment) throw new NotFoundError('Equipamento não encontrado');
    return equipment;
  }

  async create(data: CreateEquipmentDTO): Promise<Equipment> {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateEquipmentDTO): Promise<Equipment> {
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
