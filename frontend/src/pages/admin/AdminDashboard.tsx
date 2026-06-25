import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CalendarCheck,
  CreditCard,
  DollarSign,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { PlatformMetrics } from '@/types';

const KPI_CARDS = [
  { key: 'totalClinics', label: 'Clínicas', icon: Building2, fmt: (v: number) => String(v) },
  { key: 'activeClinics', label: 'Clínicas ativas', icon: Building2, fmt: (v: number) => String(v) },
  { key: 'totalProfessionals', label: 'Profissionais', icon: Stethoscope, fmt: (v: number) => String(v) },
  { key: 'totalPatients', label: 'Pacientes', icon: UserRound, fmt: (v: number) => String(v) },
  { key: 'totalAppointments', label: 'Agendamentos', icon: CalendarCheck, fmt: (v: number) => String(v) },
  { key: 'activeSubscriptions', label: 'Assinaturas ativas', icon: CreditCard, fmt: (v: number) => String(v) },
] as const;

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => (await api.get<PlatformMetrics>('/admin/metrics')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão geral da plataforma</h1>
        <p className="text-sm text-muted-foreground">Indicadores agregados de todas as clínicas</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Carregando métricas...</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {KPI_CARDS.map((card) => (
              <Card key={card.key}>
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.fmt(data[card.key])}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-mint/15 text-mint">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(data.aggregatedRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Receita agregada</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 font-semibold">Agendamentos por clínica</h2>
                <div className="space-y-2">
                  {data.appointmentsByClinic.map((c) => (
                    <div key={c.clinicId} className="flex items-center justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="font-medium">{c.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h2 className="mb-3 font-semibold">Clínicas por cidade</h2>
                <div className="space-y-2">
                  {data.clinicsByCity.map((c) => (
                    <div key={c.city} className="flex items-center justify-between text-sm">
                      <span>{c.city}</span>
                      <span className="font-medium">{c.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
