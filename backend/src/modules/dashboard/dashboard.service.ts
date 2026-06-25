import { DashboardChartsDTO, DashboardKpisDTO } from './dashboard.dtos';
import { IDashboardRepository } from './dashboard.repository';

const WORKING_HOURS_PER_DAY = 10; // expediente 08h–18h

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class DashboardService {
  constructor(private readonly repository: IDashboardRepository) {}

  async getKpis(clinicId: string, from: Date, to: Date): Promise<DashboardKpisDTO> {
    const [appointments, commissions, professionalsCount] = await Promise.all([
      this.repository.findAppointmentsInPeriod(clinicId, from, to),
      this.repository.findCommissionsInPeriod(clinicId, from, to),
      this.repository.countActiveProfessionals(clinicId),
    ]);

    const total = appointments.length;
    const canceled = appointments.filter((a) => a.status === 'CANCELED').length;
    const noShow = appointments.filter((a) => a.status === 'NO_SHOW').length;

    // KPI 1 — tempo médio entre criação do agendamento e a consulta
    const leadTimes = appointments.map(
      (a) => (a.startsAt.getTime() - a.createdAt.getTime()) / 3_600_000,
    );
    const avgBookingLeadHours =
      leadTimes.length > 0 ? leadTimes.reduce((s, v) => s + v, 0) / leadTimes.length : 0;

    // KPI 2 — taxa de ocupação: minutos agendados / capacidade total da equipe
    const activeAppointments = appointments.filter((a) => a.status !== 'CANCELED');
    const bookedMinutes = activeAppointments.reduce(
      (sum, a) => sum + (a.endsAt.getTime() - a.startsAt.getTime()) / 60_000,
      0,
    );
    const periodDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
    const capacityMinutes = professionalsCount * WORKING_HOURS_PER_DAY * 60 * periodDays;
    const occupancyRate = capacityMinutes > 0 ? (bookedMinutes / capacityMinutes) * 100 : 0;

    // KPI 5 — satisfação média (consultas avaliadas)
    const ratings = appointments
      .map((a) => a.rating)
      .filter((r): r is number => r !== null && r !== undefined);
    const patientSatisfaction =
      ratings.length > 0 ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;

    const totalRevenue = commissions.reduce((s, c) => s + Number(c.totalValue), 0);
    const clinicRevenue = commissions.reduce((s, c) => s + Number(c.clinicValue), 0);
    const professionalsRevenue = commissions.reduce(
      (s, c) => s + Number(c.professionalValue),
      0,
    );

    return {
      avgBookingLeadHours: round2(avgBookingLeadHours),
      occupancyRate: round2(occupancyRate),
      noShowRate: round2(total > 0 ? (noShow / total) * 100 : 0),
      cancellationRate: round2(total > 0 ? (canceled / total) * 100 : 0),
      patientSatisfaction: round2(patientSatisfaction),
      totalAppointments: total,
      totalRevenue: round2(totalRevenue),
      clinicRevenue: round2(clinicRevenue),
      professionalsRevenue: round2(professionalsRevenue),
    };
  }

  async getCharts(clinicId: string, from: Date, to: Date): Promise<DashboardChartsDTO> {
    const [appointments, commissions] = await Promise.all([
      this.repository.findAppointmentsInPeriod(clinicId, from, to),
      this.repository.findCommissionsInPeriod(clinicId, from, to),
    ]);

    const perDay = new Map<string, number>();
    for (const a of appointments) {
      const key = a.startsAt.toISOString().slice(0, 10);
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
    const appointmentsPerDay = Array.from(perDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const byStatus = new Map<string, number>();
    for (const a of appointments) {
      byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
    }
    const statusDistribution = Array.from(byStatus.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const byProfessional = new Map<string, { name: string; professionalValue: number; clinicValue: number }>();
    for (const c of commissions) {
      const entry = byProfessional.get(c.professionalId) ?? {
        name: c.professional.name,
        professionalValue: 0,
        clinicValue: 0,
      };
      entry.professionalValue = round2(entry.professionalValue + Number(c.professionalValue));
      entry.clinicValue = round2(entry.clinicValue + Number(c.clinicValue));
      byProfessional.set(c.professionalId, entry);
    }

    return {
      appointmentsPerDay,
      statusDistribution,
      revenueByProfessional: Array.from(byProfessional.values()),
    };
  }
}
