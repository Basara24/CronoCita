import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Star, TrendingUp, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProfessionalDashboard } from '@/types';

export function ProfessionalDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['professional', 'dashboard'],
    queryFn: async () => (await api.get<ProfessionalDashboard>('/professional/dashboard')).data,
  });

  const stats = [
    { label: 'Consultas hoje', value: data?.todayCount ?? 0, icon: CalendarDays },
    { label: 'Pacientes atendidos', value: data?.attendedPatients ?? 0, icon: Users },
    { label: 'Próximas consultas', value: data?.upcomingCount ?? 0, icon: TrendingUp },
    { label: 'Avaliação média', value: data?.averageRating != null ? data.averageRating.toFixed(1) : '—', icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olá, {data?.professional.name?.split(' ')[0] ?? 'Profissional'} 👋</h1>
        <p className="text-muted-foreground">Resumo da sua agenda e atendimentos.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-2 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{s.value}</p>}
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 text-lg font-semibold">Agenda de hoje</h2>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : data && data.todayAppointments.length > 0 ? (
            <div className="divide-y">
              {data.todayAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{a.patient.name}</p>
                    <p className="text-sm text-muted-foreground">{a.service.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">
                      {formatTime(a.startsAt)} - {formatTime(a.endsAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
