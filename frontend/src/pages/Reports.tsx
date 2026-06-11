import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DashboardCharts, DashboardKpis } from '@/types';

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function Reports() {
  const [from, setFrom] = useState(() => toInputDate(new Date(Date.now() - 30 * 86_400_000)));
  const [to, setTo] = useState(() => toInputDate(new Date(Date.now() + 7 * 86_400_000)));

  const params = { from: `${from}T00:00:00`, to: `${to}T23:59:59` };

  const { data: kpis } = useQuery({
    queryKey: ['reports', 'kpis', from, to],
    queryFn: async () => (await api.get<DashboardKpis>('/dashboard/kpis', { params })).data,
  });

  const { data: charts } = useQuery({
    queryKey: ['reports', 'charts', from, to],
    queryFn: async () => (await api.get<DashboardCharts>('/dashboard/charts', { params })).data,
  });

  const kpiRows = kpis
    ? [
        { label: 'Tempo médio de agendamento (antecedência)', value: `${kpis.avgBookingLeadHours.toFixed(1)} horas` },
        { label: 'Taxa de ocupação', value: `${kpis.occupancyRate.toFixed(1)}%` },
        { label: 'Taxa de faltas (No-show)', value: `${kpis.noShowRate.toFixed(1)}%` },
        { label: 'Taxa de cancelamento', value: `${kpis.cancellationRate.toFixed(1)}%` },
        { label: 'Satisfação do paciente', value: `${kpis.patientSatisfaction.toFixed(1)} / 5` },
        { label: 'Total de agendamentos', value: String(kpis.totalAppointments) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">KPIs detalhados por período</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>De</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Até</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpiRows.map((row) => (
          <Card key={row.label}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className="text-xl font-bold">{row.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receita por profissional</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts?.revenueByProfessional ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="professionalValue" name="Comissão profissional" fill="#1d6fc0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clinicValue" name="Receita clínica" fill="#2fb88a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
