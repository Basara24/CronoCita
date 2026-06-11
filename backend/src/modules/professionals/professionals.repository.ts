import { Prisma, Professional } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export interface IProfessionalsRepository {
  findAll(specialty?: string): Promise<Professional[]>;
  findById(id: string): Promise<Professional | null>;
  findByEmail(email: string): Promise<Professional | null>;
  findByUserId(userId: string): Promise<Professional | null>;
  listSpecialties(): Promise<string[]>;
  create(data: Prisma.ProfessionalUncheckedCreateInput): Promise<Professional>;
  update(id: string, data: Prisma.ProfessionalUncheckedUpdateInput): Promise<Professional>;
  delete(id: string): Promise<void>;
}

export class ProfessionalsRepository implements IProfessionalsRepository {
  async findAll(specialty?: string): Promise<Professional[]> {
    return prisma.professional.findMany({
      where: specialty ? { specialty } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Professional | null> {
    return prisma.professional.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Professional | null> {
    return prisma.professional.findUnique({ where: { email } });
  }

  async findByUserId(userId: string): Promise<Professional | null> {
    return prisma.professional.findUnique({ where: { userId } });
  }

  async listSpecialties(): Promise<string[]> {
    const rows = await prisma.professional.findMany({
      select: { specialty: true },
      distinct: ['specialty'],
      orderBy: { specialty: 'asc' },
    });
    return rows.map((r) => r.specialty);
  }

  async create(data: Prisma.ProfessionalUncheckedCreateInput): Promise<Professional> {
    return prisma.professional.create({ data });
  }

  async update(id: string, data: Prisma.ProfessionalUncheckedUpdateInput): Promise<Professional> {
    return prisma.professional.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.professional.delete({ where: { id } });
  }
}
