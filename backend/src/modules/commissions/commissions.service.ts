import { Commission } from '@prisma/client';
import { calculateCommission } from './calculateCommission';
import {
  CommissionSummaryDTO,
  CreateCommissionDTO,
  ListCommissionsFilterDTO,
} from './commissions.dtos';
import { CommissionWithRelations, ICommissionsRepository } from './commissions.repository';

export class CommissionsService {
  constructor(private readonly repository: ICommissionsRepository) {}

  /** Gera a comissão de um atendimento finalizado (idempotente por agendamento). */
  async createForAppointment(data: CreateCommissionDTO): Promise<Commission | null> {
    const existing = await this.repository.findByAppointmentId(data.appointmentId);
    if (existing) return null;

    const { professionalValue, clinicValue } = calculateCommission(
      data.totalValue,
      data.percentage,
    );

    return this.repository.create({
      appointmentId: data.appointmentId,
      professionalId: data.professionalId,
      totalValue: data.totalValue,
      percentage: data.percentage,
      professionalValue,
      clinicValue,
    });
  }

  async list(filter: ListCommissionsFilterDTO): Promise<CommissionWithRelations[]> {
    return this.repository.findMany(filter);
  }

  async summary(filter: ListCommissionsFilterDTO): Promise<CommissionSummaryDTO[]> {
    const commissions = await this.repository.findMany(filter);
    const byProfessional = new Map<string, CommissionSummaryDTO>();

    for (const c of commissions) {
      const entry = byProfessional.get(c.professionalId) ?? {
        professionalId: c.professionalId,
        professionalName: c.professional.name,
        specialty: c.professional.specialty,
        appointmentsCount: 0,
        totalValue: 0,
        professionalValue: 0,
        clinicValue: 0,
      };
      entry.appointmentsCount += 1;
      entry.totalValue += Number(c.totalValue);
      entry.professionalValue += Number(c.professionalValue);
      entry.clinicValue += Number(c.clinicValue);
      byProfessional.set(c.professionalId, entry);
    }

    return Array.from(byProfessional.values());
  }
}
