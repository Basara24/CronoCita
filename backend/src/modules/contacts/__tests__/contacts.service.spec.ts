jest.mock('../../../shared/database/prisma', () => ({
  prisma: {
    contact: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../../../shared/database/prisma';
import { ContactsService } from '../contacts.service';

const mocked = prisma as unknown as {
  contact: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
};

const service = new ContactsService();

beforeEach(() => jest.clearAllMocks());

describe('ContactsService', () => {
  it('cria um contato com os dados informados', async () => {
    mocked.contact.create.mockResolvedValue({ id: 'c1' });
    const data = { name: 'Ana', email: 'ana@x.com', subject: 'Oi', message: 'Mensagem de teste' };
    await service.create(data);
    expect(mocked.contact.create).toHaveBeenCalledWith({ data });
  });

  it('lista contatos filtrando por status quando informado', async () => {
    mocked.contact.findMany.mockResolvedValue([]);
    await service.list('NEW');
    expect(mocked.contact.findMany).toHaveBeenCalledWith({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('lista todos os contatos quando status não é informado', async () => {
    mocked.contact.findMany.mockResolvedValue([]);
    await service.list();
    expect(mocked.contact.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('atualiza o status de um contato existente', async () => {
    mocked.contact.findUnique.mockResolvedValue({ id: 'c1' });
    mocked.contact.update.mockResolvedValue({ id: 'c1', status: 'RESOLVED' });
    await service.updateStatus('c1', 'RESOLVED');
    expect(mocked.contact.update).toHaveBeenCalledWith({ where: { id: 'c1' }, data: { status: 'RESOLVED' } });
  });

  it('lança 404 ao atualizar contato inexistente', async () => {
    mocked.contact.findUnique.mockResolvedValue(null);
    await expect(service.updateStatus('x', 'READ')).rejects.toMatchObject({ statusCode: 404 });
  });
});
