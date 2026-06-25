import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarX, Clock, Loader2, MapPin, Stethoscope } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PatientAppointment } from '@/types';

const PERIODS = [
  { id: 'all', label: 'Todas' },
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Esta Semana' },
  { id: 'month', label: 'Este Mês' },
] as const;

type Period = (typeof PERIODS)[number]['id'];

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
  FINISHED: 'Concluído',
  NO_SHOW: 'Não compareceu',
};

export function PatientAppointmentsPage() {
  const [period, setPeriod] = useState<Period>('all');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: appointments = [], isFetching } = useQuery({
    queryKey: ['me', 'appointments', 'upcoming', period],
    queryFn: async () =>
      (await api.get<PatientAppointment[]>('/me/appointments', { params: { scope: 'upcoming', period } })).data,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/me/appointments/${id}/cancel`)).data,
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['me', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['me', 'dashboard'] });
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Meus Agendamentos</h1>
        <p className="text-muted-foreground">Consultas futuras em todas as clínicas.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.id}
            variant={period === p.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

      {isFetching && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {appointments.map((a) => (
          <Card key={a.id} data-cy="patient-appointment">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-start justify-between">
                <p className="text-lg font-semibold">{a.service.name}</p>
                <Badge>{STATUS_LABEL[a.status] ?? a.status}</Badge>
              </div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {a.clinic.name} · {a.clinic.city}
              </p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Stethoscope className="h-4 w-4" /> {a.professional.name} ({a.professional.specialty})
              </p>
              <p className="flex items-center gap-1 font-medium text-primary">
                <Clock className="h-4 w-4" /> {formatDateTime(a.startsAt)}
              </p>
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  data-cy="cancel-appointment"
                  disabled={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate(a.id)}
                >
                  <CalendarX className="h-4 w-4" /> Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isFetching && appointments.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            Nenhuma consulta agendada neste período.
          </p>
        )}
      </div>
    </div>
  );
}
