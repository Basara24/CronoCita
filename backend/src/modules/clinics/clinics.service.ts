import bcrypt from 'bcryptjs';
import { ClinicStatus } from '@prisma/client';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { slugify } from '../../shared/utils/slug';
import { prisma } from '../../shared/database/prisma';
import { ClinicsRepository, ClinicWithRelations } from './clinics.repository';
import { CreateClinicDTO, UpdateClinicDTO } from './clinics.dtos';

export class ClinicsService {
  constructor(private readonly repository: ClinicsRepository) {}

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'clinica';
    let slug = base;
    let suffix = 1;
    while (await this.repository.findBySlug(slug)) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  async list(): Promise<ClinicWithRelations[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<ClinicWithRelations> {
    const clinic = await this.repository.findById(id);
    if (!clinic) throw new NotFoundError('Clínica não encontrada');
    return clinic;
  }

  async create(data: CreateClinicDTO): Promise<ClinicWithRelations> {
    const existingCnpj = await this.repository.findByCnpj(data.cnpj);
    if (existingCnpj) throw new AppError('CNPJ já cadastrado', 409);

    const slug = await this.generateUniqueSlug(data.name);

    if (data.admin) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.admin.email } });
      if (existingUser) throw new AppError('E-mail do administrador já cadastrado', 409);
    }

    const clinic = await this.repository.create({
      name: data.name,
      slug,
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      description: data.description,
      logoUrl: data.logoUrl || null,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      status: data.status ?? 'ACTIVE',
      specialties: data.specialties?.length
        ? { create: data.specialties.map((specialty) => ({ specialty })) }
        : undefined,
    });

    if (data.admin) {
      const password = await bcrypt.hash(data.admin.password, 10);
      await prisma.user.create({
        data: {
          name: data.admin.name,
          email: data.admin.email,
          password,
          role: 'CLINIC_ADMIN',
          clinicId: clinic.id,
        },
      });
    }

    return this.getById(clinic.id);
  }

  async update(id: string, data: UpdateClinicDTO): Promise<ClinicWithRelations> {
    await this.getById(id);

    if (data.cnpj) {
      const existing = await this.repository.findByCnpj(data.cnpj);
      if (existing && existing.id !== id) throw new AppError('CNPJ já cadastrado', 409);
    }

    const { specialties, ...rest } = data;

    await this.repository.update(id, {
      ...rest,
      logoUrl: rest.logoUrl !== undefined ? rest.logoUrl || null : undefined,
    });

    if (specialties) {
      await this.repository.replaceSpecialties(id, specialties);
    }

    return this.getById(id);
  }

  async setStatus(id: string, status: ClinicStatus): Promise<ClinicWithRelations> {
    await this.getById(id);
    return this.repository.setStatus(id, status);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
