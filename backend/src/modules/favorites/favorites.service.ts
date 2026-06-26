import { prisma } from '../../shared/database/prisma';
import { NotFoundError } from '../../shared/errors/AppError';

const clinicSelect = {
  id: true,
  name: true,
  slug: true,
  city: true,
  state: true,
  logoUrl: true,
  coverImageUrl: true,
  rating: true,
  specialties: { select: { specialty: true } },
} as const;

export class FavoritesService {
  async list(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { clinic: { select: clinicSelect } },
    });
    return favorites.map((f) => ({
      favoritedAt: f.createdAt,
      ...f.clinic,
      specialties: f.clinic.specialties.map((s) => s.specialty),
    }));
  }

  async listClinicIds(userId: string): Promise<string[]> {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { clinicId: true },
    });
    return favorites.map((f) => f.clinicId);
  }

  async add(userId: string, clinicId: string) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) throw new NotFoundError('Clínica não encontrada');

    return prisma.favorite.upsert({
      where: { userId_clinicId: { userId, clinicId } },
      create: { userId, clinicId },
      update: {},
    });
  }

  async remove(userId: string, clinicId: string): Promise<void> {
    await prisma.favorite.deleteMany({ where: { userId, clinicId } });
  }

  async count(userId: string): Promise<number> {
    return prisma.favorite.count({ where: { userId } });
  }
}

export const favoritesService = new FavoritesService();
