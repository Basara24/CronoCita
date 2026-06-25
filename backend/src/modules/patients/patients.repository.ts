import { Patient } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

type PatientWriteData = {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: Date;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export interface IPatientsRepository {
  findAll(clinicId: string, search?: string): Promise<Patient[]>;
  findById(clinicId: string, id: string): Promise<Patient | null>;
  findByCpf(clinicId: string, cpf: string): Promise<Patient | null>;
  findByEmail(clinicId: string, email: string): Promise<Patient | null>;
  findByUserId(userId: string): Promise<Patient | null>;
  findAllByUserId(userId: string): Promise<Patient[]>;
  create(clinicId: string, data: PatientWriteData): Promise<Patient>;
  update(id: string, data: Partial<PatientWriteData>): Promise<Patient>;
  delete(id: string): Promise<void>;
}

export class PatientsRepository implements IPatientsRepository {
  async findAll(clinicId: string, search?: string): Promise<Patient[]> {
    return prisma.patient.findMany({
      where: {
        clinicId,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { cpf: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(clinicId: string, id: string): Promise<Patient | null> {
    return prisma.patient.findFirst({ where: { id, clinicId } });
  }

  async findByCpf(clinicId: string, cpf: string): Promise<Patient | null> {
    return prisma.patient.findFirst({ where: { clinicId, cpf } });
  }

  async findByEmail(clinicId: string, email: string): Promise<Patient | null> {
    return prisma.patient.findFirst({ where: { clinicId, email } });
  }

  async findByUserId(userId: string): Promise<Patient | null> {
    return prisma.patient.findFirst({ where: { userId } });
  }

  async findAllByUserId(userId: string): Promise<Patient[]> {
    return prisma.patient.findMany({ where: { userId } });
  }

  async create(clinicId: string, data: PatientWriteData): Promise<Patient> {
    return prisma.patient.create({ data: { ...data, clinicId } });
  }

  async update(id: string, data: Partial<PatientWriteData>): Promise<Patient> {
    return prisma.patient.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.patient.delete({ where: { id } });
  }
}
