import { PasswordResetToken, RefreshToken, User } from '@prisma/client';
import { prisma } from '../../shared/database/prisma';

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: { name: string; email: string; password: string; role: 'PATIENT' }): Promise<User>;
  saveRefreshToken(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  deleteRefreshToken(id: string): Promise<void>;
  savePasswordResetToken(data: { token: string; userId: string; expiresAt: Date }): Promise<PasswordResetToken>;
  findPasswordResetToken(token: string): Promise<PasswordResetToken | null>;
  markPasswordResetTokenUsed(id: string): Promise<void>;
  updateUserPassword(userId: string, password: string): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: { name: string; email: string; password: string; role: 'PATIENT' }): Promise<User> {
    return prisma.user.create({ data });
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
