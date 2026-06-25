import { prisma } from '../../shared/database/prisma';

export interface PlatformMetricsDTO {
  totalClinics: number;
  activeClinics: number;
  inactiveClinics: number;
  totalProfessionals: number;
  totalPatients: number;
  totalAppointments: number;
  aggregatedRevenue: number;
  activeSubscriptions: number;
  clinicsByCity: { city: string; count: number }[];
  appointmentsByClinic: { clinicId: string; name: string; count: number }[];
}

export class PlatformService {
  async getMetrics(): Promise<PlatformMetricsDTO> {
    const [
      totalClinics,
      activeClinics,
      totalProfessionals,
      totalPatients,
      totalAppointments,
      activeSubscriptions,
      commissionAgg,
      clinics,
    ] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { status: 'ACTIVE' } }),
      prisma.professional.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.commission.aggregate({ _sum: { totalValue: true } }),
      prisma.clinic.findMany({
        select: { id: true, name: true, city: true, _count: { select: { appointments: true } } },
      }),
    ]);

    const clinicsByCityMap = new Map<string, number>();
    for (const c of clinics) {
      clinicsByCityMap.set(c.city, (clinicsByCityMap.get(c.city) ?? 0) + 1);
    }

    return {
      totalClinics,
      activeClinics,
      inactiveClinics: totalClinics - activeClinics,
      totalProfessionals,
      totalPatients,
      totalAppointments,
      aggregatedRevenue: Number(commissionAgg._sum.totalValue ?? 0),
      activeSubscriptions,
      clinicsByCity: Array.from(clinicsByCityMap.entries()).map(([city, count]) => ({ city, count })),
      appointmentsByClinic: clinics
        .map((c) => ({ clinicId: c.id, name: c.name, count: c._count.appointments }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
