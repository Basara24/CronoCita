import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { IUsersRepository } from './users.repository';
import { CreateUserDTO, UpdateUserDTO, UserResponseDTO } from './users.dtos';

function toResponse(user: User): UserResponseDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    clinicId: user.clinicId,
    createdAt: user.createdAt,
  };
}

export class UsersService {
  constructor(private readonly repository: IUsersRepository) {}

  async list(clinicId: string): Promise<UserResponseDTO[]> {
    const users = await this.repository.findAll(clinicId);
    return users.map(toResponse);
  }

  async getById(clinicId: string, id: string): Promise<UserResponseDTO> {
    const user = await this.repository.findById(clinicId, id);
    if (!user) throw new NotFoundError('Usuário não encontrado');
    return toResponse(user);
  }

  async create(clinicId: string, data: CreateUserDTO): Promise<UserResponseDTO> {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) throw new AppError('E-mail já cadastrado', 409);

    const password = await bcrypt.hash(data.password, 10);
    const user = await this.repository.create(clinicId, { ...data, password });
    return toResponse(user);
  }

  async update(clinicId: string, id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    await this.getById(clinicId, id);

    if (data.email) {
      const existing = await this.repository.findByEmail(data.email);
      if (existing && existing.id !== id) throw new AppError('E-mail já cadastrado', 409);
    }

    const payload = { ...data };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    const user = await this.repository.update(id, payload);
    return toResponse(user);
  }

  async delete(clinicId: string, id: string): Promise<void> {
    await this.getById(clinicId, id);
    await this.repository.delete(id);
  }
}
