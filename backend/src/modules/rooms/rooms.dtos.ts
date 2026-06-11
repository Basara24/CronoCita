import { ResourceStatus } from '@prisma/client';

export interface CreateRoomDTO {
  name: string;
  description?: string;
  capacity: number;
  status?: ResourceStatus;
}

export type UpdateRoomDTO = Partial<CreateRoomDTO>;
