import { Patient } from '@prisma/client';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { IPatientsRepository } from './patients.repository';
import { CreatePatientDTO, UpdatePatientDTO } from './patients.dtos';

export class PatientsService {
  constructor(private readonly repository: IPatientsRepository) {}

  async list(search?: string): Promise<Patient[]> {
    return this.repository.findAll(search);
  }

  async getById(id: string): Promise<Patient> {
    const patient = await this.repository.findById(id);
    if (!patient) throw new NotFoundError('Paciente não encontrado');
    return patient;
  }

  async create(data: CreatePatientDTO): Promise<Patient> {
    const byCpf = await this.repository.findByCpf(data.cpf);
    if (byCpf) throw new AppError('CPF já cadastrado', 409);

    const byEmail = await this.repository.findByEmail(data.email);
    if (byEmail) throw new AppError('E-mail já cadastrado', 409);

    return this.repository.create({ ...data, birthDate: new Date(data.birthDate) });
  }

  async update(id: string, data: UpdatePatientDTO): Promise<Patient> {
    await this.getById(id);

    if (data.cpf) {
      const byCpf = await this.repository.findByCpf(data.cpf);
      if (byCpf && byCpf.id !== id) throw new AppError('CPF já cadastrado', 409);
    }
    if (data.email) {
      const byEmail = await this.repository.findByEmail(data.email);
      if (byEmail && byEmail.id !== id) throw new AppError('E-mail já cadastrado', 409);
    }

    return this.repository.update(id, {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
    });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
