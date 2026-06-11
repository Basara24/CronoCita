import { ResourceStatus } from '@prisma/client';

export interface CreateEquipmentDTO {
  name: string;
  description?: string;
  status?: ResourceStatus;
}

export type UpdateEquipmentDTO = Partial<CreateEquipmentDTO>;
