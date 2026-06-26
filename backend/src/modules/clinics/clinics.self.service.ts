import { ClinicPhotoCategory, Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

const selfInclude = {
  specialties: true,
  photos: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ClinicInclude;

interface UpdateOwnClinic {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number | null;
  longitude?: number | null;
}

function emptyToNull<T>(value: T | undefined): T | null | undefined {
  if (value === undefined) return undefined;
  if (value === '') return null;
  return value;
}

export class ClinicsSelfService {
  private ensureClinic(clinicId: string | null | undefined): string {
    if (!clinicId) throw new ForbiddenError('Usuário não está vinculado a uma clínica');
    return clinicId;
  }

  async get(clinicId: string | null | undefined) {
    const id = this.ensureClinic(clinicId);
    const clinic = await prisma.clinic.findUnique({ where: { id }, include: selfInclude });
    if (!clinic) throw new NotFoundError('Clínica não encontrada');
    return clinic;
  }

  async update(clinicId: string | null | undefined, data: UpdateOwnClinic) {
    const id = this.ensureClinic(clinicId);
    await prisma.clinic.update({
      where: { id },
      data: {
        name: data.name,
        description: emptyToNull(data.description),
        phone: data.phone,
        email: data.email,
        logoUrl: emptyToNull(data.logoUrl),
        coverImageUrl: emptyToNull(data.coverImageUrl),
        website: emptyToNull(data.website),
        instagram: emptyToNull(data.instagram),
        facebook: emptyToNull(data.facebook),
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
      },
    });
    return this.get(id);
  }

  async addPhoto(
    clinicId: string | null | undefined,
    url: string,
    category?: ClinicPhotoCategory,
    caption?: string,
  ) {
    const id = this.ensureClinic(clinicId);
    return prisma.clinicPhoto.create({
      data: { clinicId: id, url, category: category ?? 'OTHER', caption: caption || null },
    });
  }

  async removePhoto(clinicId: string | null | undefined, photoId: string): Promise<void> {
    const id = this.ensureClinic(clinicId);
    const photo = await prisma.clinicPhoto.findFirst({ where: { id: photoId, clinicId: id } });
    if (!photo) throw new NotFoundError('Foto não encontrada');
    await prisma.clinicPhoto.delete({ where: { id: photoId } });
  }
}

export const clinicsSelfService = new ClinicsSelfService();
