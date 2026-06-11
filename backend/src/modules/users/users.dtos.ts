import { Role } from '@prisma/client';

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}
