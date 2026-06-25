import { Clinic, ClinicStatus, Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export type ClinicWithRelations = Prisma.ClinicGetPayload<{
  include: { specialties: true; subscription: true; _count: { select: { professionals: true; appointments: true } } };
}>;

const include = {
  specialties: true,
  subscription: true,
  _count: { select: { professionals: true, appointments: true } },
} as const;

export interface IClinicsRepository {
  findAll(): Promise<ClinicWithRelations[]>;
  findById(id: string): Promise<ClinicWithRelations | null>;
  findBySlug(slug: string): Promise<Clinic | null>;
  findByCnpj(cnpj: string): Promise<Clinic | null>;
  create(data: Prisma.ClinicCreateInput): Promise<ClinicWithRelations>;
  update(id: string, data: Prisma.ClinicUpdateInput): Promise<ClinicWithRelations>;
  setStatus(id: string, status: ClinicStatus): Promise<ClinicWithRelations>;
  delete(id: string): Promise<void>;
  replaceSpecialties(clinicId: string, specialties: string[]): Promise<void>;
}

export class ClinicsRepository implements IClinicsRepository {
  async findAll(): Promise<ClinicWithRelations[]> {
    return prisma.clinic.findMany({ include, orderBy: { name: 'asc' } });
  }

  async findById(id: string): Promise<ClinicWithRelations | null> {
    return prisma.clinic.findUnique({ where: { id }, include });
  }

  async findBySlug(slug: string): Promise<Clinic | null> {
    return prisma.clinic.findUnique({ where: { slug } });
  }

  async findByCnpj(cnpj: string): Promise<Clinic | null> {
    return prisma.clinic.findUnique({ where: { cnpj } });
  }

  async create(data: Prisma.ClinicCreateInput): Promise<ClinicWithRelations> {
    return prisma.clinic.create({ data, include });
  }

  async update(id: string, data: Prisma.ClinicUpdateInput): Promise<ClinicWithRelations> {
    return prisma.clinic.update({ where: { id }, data, include });
  }

  async setStatus(id: string, status: ClinicStatus): Promise<ClinicWithRelations> {
    return prisma.clinic.update({ where: { id }, data: { status }, include });
  }

  async delete(id: string): Promise<void> {
    await prisma.clinic.delete({ where: { id } });
  }

  async replaceSpecialties(clinicId: string, specialties: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.clinicSpecialty.deleteMany({ where: { clinicId } }),
      prisma.clinicSpecialty.createMany({
        data: specialties.map((specialty) => ({ clinicId, specialty })),
      }),
    ]);
  }
}
