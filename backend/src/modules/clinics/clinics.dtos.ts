import { ClinicStatus } from '@prisma/client';

export interface CreateClinicDTO {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  description?: string;
  logoUrl?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  specialties?: string[];
  status?: ClinicStatus;
  admin?: {
    name: string;
    email: string;
    password: string;
  };
}

export type UpdateClinicDTO = Partial<Omit<CreateClinicDTO, 'admin'>>;
