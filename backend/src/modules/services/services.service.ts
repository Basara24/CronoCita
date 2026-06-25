import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { IServicesRepository, ServiceWithEquipments } from './services.repository';
import { CreateServiceDTO, UpdateServiceDTO } from './services.dtos';

export class ServicesService {
  constructor(private readonly repository: IServicesRepository) {}

  private async assertEquipmentsBelongToClinic(clinicId: string, equipmentIds?: string[]): Promise<void> {
    if (!equipmentIds || equipmentIds.length === 0) return;
    const count = await this.repository.countEquipmentsInClinic(clinicId, equipmentIds);
    if (count !== equipmentIds.length) {
      throw new AppError('Um ou mais equipamentos não pertencem a esta clínica', 400);
    }
  }

  async list(clinicId: string): Promise<ServiceWithEquipments[]> {
    return this.repository.findAll(clinicId);
  }

  async getById(clinicId: string, id: string): Promise<ServiceWithEquipments> {
    const service = await this.repository.findById(clinicId, id);
    if (!service) throw new NotFoundError('Serviço não encontrado');
    return service;
  }

  async create(clinicId: string, data: CreateServiceDTO): Promise<ServiceWithEquipments> {
    await this.assertEquipmentsBelongToClinic(clinicId, data.equipmentIds);
    return this.repository.create(clinicId, data);
  }

  async update(clinicId: string, id: string, data: UpdateServiceDTO): Promise<ServiceWithEquipments> {
    await this.getById(clinicId, id);
    await this.assertEquipmentsBelongToClinic(clinicId, data.equipmentIds);
    return this.repository.update(id, data);
  }

  async delete(clinicId: string, id: string): Promise<void> {
    await this.getById(clinicId, id);
    await this.repository.delete(id);
  }
}
