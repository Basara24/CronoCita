import { Patient, Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export interface IPatientsRepository {
  findAll(search?: string): Promise<Patient[]>;
  findById(id: string): Promise<Patient | null>;
  findByCpf(cpf: string): Promise<Patient | null>;
  findByEmail(email: string): Promise<Patient | null>;
  findByUserId(userId: string): Promise<Patient | null>;
  create(data: Prisma.PatientUncheckedCreateInput): Promise<Patient>;
  update(id: string, data: Prisma.PatientUncheckedUpdateInput): Promise<Patient>;
  delete(id: string): Promise<void>;
}

export class PatientsRepository implements IPatientsRepository {
  async findAll(search?: string): Promise<Patient[]> {
    return prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { cpf: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Patient | null> {
    return prisma.patient.findUnique({ where: { id } });
  }

  async findByCpf(cpf: string): Promise<Patient | null> {
    return prisma.patient.findUnique({ where: { cpf } });
  }

  async findByEmail(email: string): Promise<Patient | null> {
    return prisma.patient.findUnique({ where: { email } });
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    return prisma.patient.findUnique({ where: { userId } });
  }

  async create(data: Prisma.PatientUncheckedCreateInput): Promise<Patient> {
    return prisma.patient.create({ data });
  }

  async update(id: string, data: Prisma.PatientUncheckedUpdateInput): Promise<Patient> {
    return prisma.patient.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.patient.delete({ where: { id } });
  }
}
