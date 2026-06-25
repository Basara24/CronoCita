import { Equipment } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/AppError';
import { IEquipmentsRepository } from './equipments.repository';
import { CreateEquipmentDTO, UpdateEquipmentDTO } from './equipments.dtos';

export class EquipmentsService {
  constructor(private readonly repository: IEquipmentsRepository) {}

  async list(clinicId: string): Promise<Equipment[]> {
    return this.repository.findAll(clinicId);
  }

  async getById(clinicId: string, id: string): Promise<Equipment> {
    const equipment = await this.repository.findById(clinicId, id);
    if (!equipment) throw new NotFoundError('Equipamento não encontrado');
    return equipment;
  }

  async create(clinicId: string, data: CreateEquipmentDTO): Promise<Equipment> {
    return this.repository.create(clinicId, data);
  }

  async update(clinicId: string, id: string, data: UpdateEquipmentDTO): Promise<Equipment> {
    await this.getById(clinicId, id);
    return this.repository.update(id, data);
  }

  async delete(clinicId: string, id: string): Promise<void> {
    await this.getById(clinicId, id);
    await this.repository.delete(id);
  }
}
