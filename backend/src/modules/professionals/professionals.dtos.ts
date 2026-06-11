export interface CreateProfessionalDTO {
  name: string;
  specialty: string;
  commissionPercentage: number;
  phone: string;
  email: string;
}

export type UpdateProfessionalDTO = Partial<CreateProfessionalDTO>;
