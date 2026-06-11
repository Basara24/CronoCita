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
    createdAt: user.createdAt,
  };
}

export class UsersService {
  constructor(private readonly repository: IUsersRepository) {}

  async list(): Promise<UserResponseDTO[]> {
    const users = await this.repository.findAll();
    return users.map(toResponse);
  }

  async getById(id: string): Promise<UserResponseDTO> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError('Usuário não encontrado');
    return toResponse(user);
  }

  async create(data: CreateUserDTO): Promise<UserResponseDTO> {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) throw new AppError('E-mail já cadastrado', 409);

    const password = await bcrypt.hash(data.password, 10);
    const user = await this.repository.create({ ...data, password });
    return toResponse(user);
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserResponseDTO> {
    await this.getById(id);

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

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
