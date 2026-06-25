import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Input } from '@/components/ui/input';
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
import type { PatientAppointment } from '@/types';

const STATUS_LABEL: Record<string, string> = {
  FINISHED: 'Concluído',
  CANCELED: 'Cancelado',
  NO_SHOW: 'No-show',
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
};

export function PatientHistoryPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  const { data: history = [] } = useQuery({
    queryKey: ['me', 'appointments', 'history', debounced],
    queryFn: async () =>
      (await api.get<PatientAppointment[]>('/me/appointments', {
        params: { scope: 'history', search: debounced || undefined },
      })).data,
  });

  function handleSearch(value: string) {
    setSearch(value);
    setDebounced(value);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Histórico de Serviços</h1>
        <p className="text-muted-foreground">Todos os atendimentos realizados nas clínicas.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Pesquisar por serviço, profissional ou clínica"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Clínica</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.service.name}</TableCell>
                  <TableCell>{a.clinic.name}</TableCell>
                  <TableCell>{a.professional.name}</TableCell>
                  <TableCell>{formatDate(a.startsAt)}</TableCell>
                  <TableCell>{formatCurrency(a.service.price)}</TableCell>
                  <TableCell>
                    <Badge>{STATUS_LABEL[a.status] ?? a.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Nenhum atendimento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
