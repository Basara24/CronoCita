export interface DashboardKpisDTO {
  /** KPI 1 — tempo médio (em horas) entre a criação do agendamento e a consulta */
  avgBookingLeadHours: number;
  /** KPI 2 — taxa de ocupação da agenda (%) */
  occupancyRate: number;
  /** KPI 3 — taxa de faltas / no-show (%) */
  noShowRate: number;
  /** KPI 4 — taxa de cancelamento (%) */
  cancellationRate: number;
  /** KPI 5 — satisfação média do paciente (1 a 5) */
  patientSatisfaction: number;
  totalAppointments: number;
  totalRevenue: number;
  clinicRevenue: number;
  professionalsRevenue: number;
}

export interface DashboardChartsDTO {
  appointmentsPerDay: { date: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  revenueByProfessional: { name: string; professionalValue: number; clinicValue: number }[];
}
