import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, CalendarCheck, History, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PatientDashboard } from '@/types';

export function PatientDashboardPage() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['me', 'dashboard'],
    queryFn: async () => (await api.get<PatientDashboard>('/me/dashboard')).data,
  });

  const next = data?.nextAppointment;

  const cards = [
    { to: '/meus-agendamentos', label: 'Meus Agendamentos', icon: CalendarCheck, value: next ? 'Próxima agendada' : 'Nenhuma' },
    { to: '/meus-agendamentos?scope=history', label: 'Histórico', icon: History, value: `${data?.completedCount ?? 0} consultas` },
    { to: '/mensagens', label: 'Mensagens', icon: MessageSquare, value: 'Conversas' },
    { to: '/notificacoes', label: 'Notificações', icon: Bell, value: `${data?.unreadNotifications ?? 0} não lidas` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground">Acompanhe suas consultas e mensagens em um só lugar.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Próxima consulta</p>
            {next ? (
              <div className="mt-2">
                <p className="text-lg font-semibold">{next.service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {next.clinic.name} · {next.professional.name}
                </p>
                <p className="mt-1 font-medium text-primary">{formatDateTime(next.startsAt)}</p>
                <Link to="/meus-agendamentos" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}>
                  Ver detalhes
                </Link>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-muted-foreground">Você não tem consultas agendadas.</p>
                <Link to="/" className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}>
                  Encontrar uma clínica
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid grid-cols-2 gap-4 p-5 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{data?.completedCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Consultas realizadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{data?.clinicsVisited ?? 0}</p>
              <p className="text-xs text-muted-foreground">Clínicas visitadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{data?.unreadNotifications ?? 0}</p>
              <p className="text-xs text-muted-foreground">Notificações</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{next ? 1 : 0}</p>
              <p className="text-xs text-muted-foreground">Próximas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="transition-all hover:border-primary hover:shadow-md">
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
