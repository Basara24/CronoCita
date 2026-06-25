import { Prisma, User } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export interface IUsersRepository {
  findAll(clinicId: string): Promise<User[]>;
  findById(clinicId: string, id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(clinicId: string, data: Omit<Prisma.UserUncheckedCreateInput, 'clinicId'>): Promise<User>;
  update(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<User>;
  delete(id: string): Promise<void>;
}

export class UsersRepository implements IUsersRepository {
  async findAll(clinicId: string): Promise<User[]> {
    return prisma.user.findMany({ where: { clinicId }, orderBy: { name: 'asc' } });
  }

  async findById(clinicId: string, id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, clinicId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(
    clinicId: string,
    data: Omit<Prisma.UserUncheckedCreateInput, 'clinicId'>,
  ): Promise<User> {
    return prisma.user.create({ data: { ...data, clinicId } });
  }

  async update(id: string, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
