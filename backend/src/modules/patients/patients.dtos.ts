export interface CreatePatientDTO {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export type UpdatePatientDTO = Partial<CreatePatientDTO>;
