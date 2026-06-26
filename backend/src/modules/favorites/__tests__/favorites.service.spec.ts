jest.mock('../../../shared/database/prisma', () => ({
  prisma: {
    clinic: { findUnique: jest.fn() },
    favorite: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { prisma } from '../../../shared/database/prisma';
import { FavoritesService } from '../favorites.service';

const mocked = prisma as unknown as {
  clinic: { findUnique: jest.Mock };
  favorite: { findMany: jest.Mock; upsert: jest.Mock; deleteMany: jest.Mock; count: jest.Mock };
};

const service = new FavoritesService();

beforeEach(() => jest.clearAllMocks());

describe('FavoritesService', () => {
  it('mapeia a lista de favoritos achatando a clínica e especialidades', async () => {
    mocked.favorite.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-01-01'),
        clinic: {
          id: 'cl1',
          name: 'Clínica X',
          slug: 'clinica-x',
          city: 'Maringá',
          state: 'PR',
          logoUrl: null,
          coverImageUrl: null,
          rating: 4.5,
          specialties: [{ specialty: 'Fisioterapia' }, { specialty: 'Nutrição' }],
        },
      },
    ]);

    const result = await service.list('user-1');
    expect(result[0]).toMatchObject({ id: 'cl1', specialties: ['Fisioterapia', 'Nutrição'] });
  });

  it('adiciona favorito via upsert validando a clínica', async () => {
    mocked.clinic.findUnique.mockResolvedValue({ id: 'cl1' });
    mocked.favorite.upsert.mockResolvedValue({ id: 'f1' });
    await service.add('user-1', 'cl1');
    expect(mocked.favorite.upsert).toHaveBeenCalledWith({
      where: { userId_clinicId: { userId: 'user-1', clinicId: 'cl1' } },
      create: { userId: 'user-1', clinicId: 'cl1' },
      update: {},
    });
  });

  it('lança 404 ao favoritar clínica inexistente', async () => {
    mocked.clinic.findUnique.mockResolvedValue(null);
    await expect(service.add('user-1', 'x')).rejects.toMatchObject({ statusCode: 404 });
    expect(mocked.favorite.upsert).not.toHaveBeenCalled();
  });

  it('remove favorito por usuário e clínica', async () => {
    mocked.favorite.deleteMany.mockResolvedValue({ count: 1 });
    await service.remove('user-1', 'cl1');
    expect(mocked.favorite.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1', clinicId: 'cl1' } });
  });
});
