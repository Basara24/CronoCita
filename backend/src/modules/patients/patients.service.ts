import { Patient } from '@prisma/client';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { IPatientsRepository } from './patients.repository';
import { CreatePatientDTO, UpdatePatientDTO } from './patients.dtos';

export class PatientsService {
  constructor(private readonly repository: IPatientsRepository) {}

  async list(clinicId: string, search?: string): Promise<Patient[]> {
    return this.repository.findAll(clinicId, search);
  }

  async getById(clinicId: string, id: string): Promise<Patient> {
    const patient = await this.repository.findById(clinicId, id);
    if (!patient) throw new NotFoundError('Paciente não encontrado');
    return patient;
  }

  async create(clinicId: string, data: CreatePatientDTO): Promise<Patient> {
    const byCpf = await this.repository.findByCpf(clinicId, data.cpf);
    if (byCpf) throw new AppError('CPF já cadastrado', 409);

    const byEmail = await this.repository.findByEmail(clinicId, data.email);
    if (byEmail) throw new AppError('E-mail já cadastrado', 409);

    return this.repository.create(clinicId, { ...data, birthDate: new Date(data.birthDate) });
  }

  async update(clinicId: string, id: string, data: UpdatePatientDTO): Promise<Patient> {
    await this.getById(clinicId, id);

    if (data.cpf) {
      const byCpf = await this.repository.findByCpf(clinicId, data.cpf);
      if (byCpf && byCpf.id !== id) throw new AppError('CPF já cadastrado', 409);
    }
    if (data.email) {
      const byEmail = await this.repository.findByEmail(clinicId, data.email);
      if (byEmail && byEmail.id !== id) throw new AppError('E-mail já cadastrado', 409);
    }

    return this.repository.update(id, {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
    });
  }

  async delete(clinicId: string, id: string): Promise<void> {
    await this.getById(clinicId, id);
    await this.repository.delete(id);
  }
}
