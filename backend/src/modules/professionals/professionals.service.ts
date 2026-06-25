import { Professional } from '@prisma/client';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { IProfessionalsRepository } from './professionals.repository';
import { CreateProfessionalDTO, UpdateProfessionalDTO } from './professionals.dtos';

export class ProfessionalsService {
  constructor(private readonly repository: IProfessionalsRepository) {}

  async list(clinicId: string, specialty?: string): Promise<Professional[]> {
    return this.repository.findAll(clinicId, specialty);
  }

  async listSpecialties(clinicId: string): Promise<string[]> {
    return this.repository.listSpecialties(clinicId);
  }

  async getById(clinicId: string, id: string): Promise<Professional> {
    const professional = await this.repository.findById(clinicId, id);
    if (!professional) throw new NotFoundError('Profissional não encontrado');
    return professional;
  }

  async create(clinicId: string, data: CreateProfessionalDTO): Promise<Professional> {
    const existing = await this.repository.findByEmail(clinicId, data.email);
    if (existing) throw new AppError('E-mail já cadastrado', 409);
    return this.repository.create(clinicId, data);
  }

  async update(clinicId: string, id: string, data: UpdateProfessionalDTO): Promise<Professional> {
    await this.getById(clinicId, id);

    if (data.email) {
      const existing = await this.repository.findByEmail(clinicId, data.email);
      if (existing && existing.id !== id) throw new AppError('E-mail já cadastrado', 409);
    }

    return this.repository.update(id, data);
  }

  async delete(clinicId: string, id: string): Promise<void> {
    await this.getById(clinicId, id);
    await this.repository.delete(id);
  }
}
