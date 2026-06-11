import { NotFoundError } from '../../shared/errors/AppError';
import { IServicesRepository, ServiceWithEquipments } from './services.repository';
import { CreateServiceDTO, UpdateServiceDTO } from './services.dtos';

export class ServicesService {
  constructor(private readonly repository: IServicesRepository) {}

  async list(): Promise<ServiceWithEquipments[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<ServiceWithEquipments> {
    const service = await this.repository.findById(id);
    if (!service) throw new NotFoundError('Serviço não encontrado');
    return service;
  }

  async create(data: CreateServiceDTO): Promise<ServiceWithEquipments> {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateServiceDTO): Promise<ServiceWithEquipments> {
    await this.getById(id);
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }
}
