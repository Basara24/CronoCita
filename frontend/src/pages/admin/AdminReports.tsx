import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Clinic, PlatformMetrics } from '@/types';

export function AdminReports() {
  const { data: metrics } = useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => (await api.get<PlatformMetrics>('/admin/metrics')).data,
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => (await api.get<Clinic[]>('/clinics')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Consolidado das clínicas e assinaturas</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold">{metrics.totalClinics}</p>
              <p className="text-xs text-muted-foreground">Clínicas totais</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold">{metrics.totalAppointments}</p>
              <p className="text-xs text-muted-foreground">Agendamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold">{formatCurrency(metrics.aggregatedRevenue)}</p>
              <p className="text-xs text-muted-foreground">Receita agregada</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-2xl font-bold">{metrics.activeSubscriptions}</p>
              <p className="text-xs text-muted-foreground">Assinaturas ativas</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-semibold">Clínicas cadastradas</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clínica</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Profissionais</TableHead>
                <TableHead>Agendamentos</TableHead>
                <TableHead>Plano</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    {c.city} - {c.state}
                  </TableCell>
                  <TableCell>{c._count?.professionals ?? 0}</TableCell>
                  <TableCell>{c._count?.appointments ?? 0}</TableCell>
                  <TableCell>{c.subscription?.plan ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
