export interface CreateCommissionDTO {
  clinicId: string;
  appointmentId: string;
  professionalId: string;
  totalValue: number;
  percentage: number;
}

export interface ListCommissionsFilterDTO {
  clinicId: string;
  professionalId?: string;
  from?: Date;
  to?: Date;
}

export interface CommissionSummaryDTO {
  professionalId: string;
  professionalName: string;
  specialty: string;
  appointmentsCount: number;
  totalValue: number;
  professionalValue: number;
  clinicValue: number;
}
