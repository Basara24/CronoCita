import { Professional } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { CreateProfessionalDTO, UpdateProfessionalDTO } from './professionals.dtos';

export interface IProfessionalsRepository {
  findAll(clinicId: string, specialty?: string): Promise<Professional[]>;
  findById(clinicId: string, id: string): Promise<Professional | null>;
  findByEmail(clinicId: string, email: string): Promise<Professional | null>;
  findByUserId(userId: string): Promise<Professional | null>;
  listSpecialties(clinicId: string): Promise<string[]>;
  create(clinicId: string, data: CreateProfessionalDTO): Promise<Professional>;
  update(id: string, data: UpdateProfessionalDTO): Promise<Professional>;
  delete(id: string): Promise<void>;
}

export class ProfessionalsRepository implements IProfessionalsRepository {
  async findAll(clinicId: string, specialty?: string): Promise<Professional[]> {
    return prisma.professional.findMany({
      where: { clinicId, ...(specialty ? { specialty } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  async findById(clinicId: string, id: string): Promise<Professional | null> {
    return prisma.professional.findFirst({ where: { id, clinicId } });
  }

  async findByEmail(clinicId: string, email: string): Promise<Professional | null> {
    return prisma.professional.findFirst({ where: { clinicId, email } });
  }

  async findByUserId(userId: string): Promise<Professional | null> {
    return prisma.professional.findUnique({ where: { userId } });
  }

  async listSpecialties(clinicId: string): Promise<string[]> {
    const rows = await prisma.professional.findMany({
      where: { clinicId },
      select: { specialty: true },
      distinct: ['specialty'],
      orderBy: { specialty: 'asc' },
    });
    return rows.map((r) => r.specialty);
  }

  async create(clinicId: string, data: CreateProfessionalDTO): Promise<Professional> {
    return prisma.professional.create({ data: { ...data, clinicId } });
  }

  async update(id: string, data: UpdateProfessionalDTO): Promise<Professional> {
    return prisma.professional.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.professional.delete({ where: { id } });
  }
}
