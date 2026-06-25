import { useQuery } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Commission, CommissionSummary } from '@/types';

export function Financial() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'CLINIC_ADMIN';

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions'],
    queryFn: async () => (await api.get<Commission[]>('/commissions')).data,
  });

  const { data: summary = [] } = useQuery({
    queryKey: ['commissions', 'summary'],
    queryFn: async () => (await api.get<CommissionSummary[]>('/commissions/summary')).data,
  });

  const totals = summary.reduce(
    (acc, s) => ({
      total: acc.total + s.totalValue,
      professional: acc.professional + s.professionalValue,
      clinic: acc.clinic + s.clinicValue,
    }),
    { total: 0, professional: 0, clinic: 0 },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? 'Comissões de todos os profissionais' : 'Suas comissões'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Faturamento total</p>
              <p className="text-xl font-bold">{formatCurrency(totals.total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Repasse aos profissionais</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(totals.professional)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Receita da clínica</p>
            <p className="text-xl font-bold text-mint">{formatCurrency(totals.clinic)}</p>
          </CardContent>
        </Card>
      </div>

      {isAdmin && summary.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Resumo por profissional</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Atendimentos</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Comissão</TableHead>
                <TableHead>Clínica</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((s) => (
                <TableRow key={s.professionalId}>
                  <TableCell className="font-medium">{s.professionalName}</TableCell>
                  <TableCell>
                    <Badge variant="mint">{s.specialty}</Badge>
                  </TableCell>
                  <TableCell>{s.appointmentsCount}</TableCell>
                  <TableCell>{formatCurrency(s.totalValue)}</TableCell>
                  <TableCell className="text-primary">{formatCurrency(s.professionalValue)}</TableCell>
                  <TableCell className="text-mint">{formatCurrency(s.clinicValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Lançamentos</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead className="hidden md:table-cell">Paciente</TableHead>
              <TableHead>Serviço</TableHead>
              {isAdmin && <TableHead className="hidden md:table-cell">Profissional</TableHead>}
              <TableHead>Valor</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Comissão</TableHead>
              <TableHead className="hidden md:table-cell">Clínica</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{formatDateTime(c.createdAt)}</TableCell>
                <TableCell className="hidden md:table-cell">{c.appointment.patient.name}</TableCell>
                <TableCell>{c.appointment.service.name}</TableCell>
                {isAdmin && (
                  <TableCell className="hidden md:table-cell">{c.professional.name}</TableCell>
                )}
                <TableCell>{formatCurrency(c.totalValue)}</TableCell>
                <TableCell>{Number(c.percentage).toFixed(0)}%</TableCell>
                <TableCell className="font-medium text-primary">
                  {formatCurrency(c.professionalValue)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-mint">
                  {formatCurrency(c.clinicValue)}
                </TableCell>
              </TableRow>
            ))}
            {commissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Nenhuma comissão registrada ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
