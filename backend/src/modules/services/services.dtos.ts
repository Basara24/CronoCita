export interface CreateServiceDTO {
  name: string;
  durationMinutes: number;
  price: number;
  requiresRoom?: boolean;
  equipmentIds?: string[];
}

export type UpdateServiceDTO = Partial<CreateServiceDTO>;
