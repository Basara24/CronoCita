import { ContactStatus } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';
import { NotFoundError } from '../../shared/errors/AppError';
import { CreateContactDTO } from './contacts.validators';

export class ContactsService {
  async create(data: CreateContactDTO) {
    return prisma.contact.create({ data });
  }

  async list(status?: ContactStatus) {
    return prisma.contact.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: ContactStatus) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundError('Contato não encontrado');
    return prisma.contact.update({ where: { id }, data: { status } });
  }
}

export const contactsService = new ContactsService();
