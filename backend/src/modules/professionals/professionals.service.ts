import { Professional } from '@prisma/client';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { IProfessionalsRepository } from './professionals.repository';
import { CreateProfessionalDTO, UpdateProfessionalDTO } from './professionals.dtos';

export class ProfessionalsService {
  constructor(private readonly repository: IProfessionalsRepository) {}

  async list(specialty?: string): Promise<Professional[]> {
    return this.repository.findAll(specialty);
  }

  async listSpecialties(): Promise<string[]> {
    return this.repository.listSpecialties();
  }

  async getById(id: string): Promise<Professional> {
    const professional = await this.repository.findById(id);
    if (!professional) throw new NotFoundError('Profissional não encontrado');
    return professional;
  }

  async create(data: CreateProfessionalDTO): Promise<Professional> {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) throw new AppError('E-mail já cadastrado', 409);
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateProfessionalDTO): Promise<Professional> {
    await this.getById(id);

    if (data.email) {
      const existing = await this.repository.findByEmail(data.email);
      if (existing && existing.id !== id) throw new AppError('E-mail já cadastrado', 409);
    }

    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
