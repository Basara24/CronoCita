import { PasswordResetToken, Prisma, RefreshToken } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export type UserWithClinic = Prisma.UserGetPayload<{ include: { clinic: true } }>;

export interface CreatePatientUserData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
  role: 'PATIENT';
}

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<UserWithClinic | null>;
  findUserByCpf(cpf: string): Promise<UserWithClinic | null>;
  findUserById(id: string): Promise<UserWithClinic | null>;
  createUser(data: CreatePatientUserData): Promise<UserWithClinic>;
  linkPatientsByCpf(cpf: string, userId: string): Promise<void>;
  saveRefreshToken(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  deleteRefreshToken(id: string): Promise<void>;
  savePasswordResetToken(data: { token: string; userId: string; expiresAt: Date }): Promise<PasswordResetToken>;
  findPasswordResetToken(token: string): Promise<PasswordResetToken | null>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
  updateUserPassword(userId: string, password: string): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<UserWithClinic | null> {
    return prisma.user.findUnique({ where: { email }, include: { clinic: true } });
  }

  async findUserByCpf(cpf: string): Promise<UserWithClinic | null> {
    return prisma.user.findUnique({ where: { cpf }, include: { clinic: true } });
  }

  async findUserById(id: string): Promise<UserWithClinic | null> {
    return prisma.user.findUnique({ where: { id }, include: { clinic: true } });
  }

  async createUser(data: CreatePatientUserData): Promise<UserWithClinic> {
    return prisma.user.create({ data, include: { clinic: true } });
  }

  /** Vincula registros Patient existentes (mesmo CPF, ainda sem dono) à conta global. */
  async linkPatientsByCpf(cpf: string, userId: string): Promise<void> {
    await prisma.patient.updateMany({
      where: { cpf, userId: null },
      data: { userId },
    });
  }

  async saveRefreshToken(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { token } });
  }

  async deleteRefreshToken(id: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { id } });
  }

  async savePasswordResetToken(data: { token: string; userId: string; expiresAt: Date }): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({ data });
  }

  async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { password } });
  }
}
