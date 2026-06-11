import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarClock, Clock, Percent, Smile, UserX, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardCharts, DashboardKpis } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
  FINISHED: 'Finalizado',
  NO_SHOW: 'Falta',
};

const PIE_COLORS = ['#1d6fc0', '#2fb88a', '#e05252', '#7c5cd6', '#e0a030'];

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: typeof Clock;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: kpis } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => (await api.get<DashboardKpis>('/dashboard/kpis')).data,
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: async () => (await api.get<DashboardCharts>('/dashboard/charts')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores dos últimos 30 dias e próximos 7 dias
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Tempo médio de agendamento"
          value={kpis ? `${kpis.avgBookingLeadHours.toFixed(0)}h` : '—'}
          hint="antecedência média"
          icon={Clock}
        />
        <KpiCard
          title="Taxa de ocupação"
          value={kpis ? `${kpis.occupancyRate.toFixed(1)}%` : '—'}
          hint="da capacidade da equipe"
          icon={Percent}
        />
        <KpiCard
          title="Taxa de faltas (No-show)"
          value={kpis ? `${kpis.noShowRate.toFixed(1)}%` : '—'}
          icon={UserX}
        />
        <KpiCard
          title="Taxa de cancelamento"
          value={kpis ? `${kpis.cancellationRate.toFixed(1)}%` : '—'}
          icon={XCircle}
        />
        <KpiCard
          title="Satisfação do paciente"
          value={kpis ? `${kpis.patientSatisfaction.toFixed(1)} / 5` : '—'}
          icon={Smile}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Faturamento total</p>
            <p className="text-2xl font-bold text-primary">
              {kpis ? formatCurrency(kpis.totalRevenue) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Receita da clínica</p>
            <p className="text-2xl font-bold text-mint">
              {kpis ? formatCurrency(kpis.clinicRevenue) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Repasse aos profissionais</p>
            <p className="text-2xl font-bold">
              {kpis ? formatCurrency(kpis.professionalsRevenue) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" /> Agendamentos por dia
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.appointmentsPerDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Agendamentos"
                  stroke="#1d6fc0"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(charts?.statusDistribution ?? []).map((s) => ({
                    ...s,
                    name: STATUS_LABELS[s.status] ?? s.status,
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {(charts?.statusDistribution ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
