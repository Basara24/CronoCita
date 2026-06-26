import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, endOfWeek, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ban, ChevronLeft, ChevronRight, Clock, Trash2, X } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import type { ProfessionalAppointment, ScheduleBlock } from '@/types';

export function ProfessionalAgendaPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [blockForm, setBlockForm] = useState({ startsAt: '', endsAt: '', reason: '' });
  const [showBlockForm, setShowBlockForm] = useState(false);

  const { weekStart, weekEnd, days } = useMemo(() => {
    const base = addDays(new Date(), weekOffset * 7);
    const ws = startOfWeek(base, { weekStartsOn: 1 });
    const we = endOfWeek(base, { weekStartsOn: 1 });
    return {
      weekStart: ws,
      weekEnd: we,
      days: Array.from({ length: 7 }).map((_, i) => addDays(ws, i)),
    };
  }, [weekOffset]);

  const params = { from: weekStart.toISOString(), to: weekEnd.toISOString() };

  const { data: appointments = [] } = useQuery({
    queryKey: ['professional', 'appointments', params],
    queryFn: async () => (await api.get<ProfessionalAppointment[]>('/professional/appointments', { params })).data,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['professional', 'blocks', params],
    queryFn: async () => (await api.get<ScheduleBlock[]>('/professional/blocks', { params })).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['professional', 'appointments'] });
    queryClient.invalidateQueries({ queryKey: ['professional', 'blocks'] });
  }

  const cancelMut = useMutation({
    mutationFn: async (id: string) => api.patch(`/professional/appointments/${id}/cancel`),
    onSuccess: () => {
      toast.success('Consulta cancelada');
      invalidate();
    },
    onError: (e) => toast.error('Erro', apiErrorMessage(e)),
  });

  const rescheduleMut = useMutation({
    mutationFn: async ({ id, startsAt }: { id: string; startsAt: string }) =>
      api.patch(`/professional/appointments/${id}/reschedule`, { startsAt: new Date(startsAt).toISOString() }),
    onSuccess: () => {
      toast.success('Consulta remarcada');
      invalidate();
    },
    onError: (e) => toast.error('Não foi possível remarcar', apiErrorMessage(e)),
  });

  const createBlockMut = useMutation({
    mutationFn: async () =>
      api.post('/professional/blocks', {
        startsAt: new Date(blockForm.startsAt).toISOString(),
        endsAt: new Date(blockForm.endsAt).toISOString(),
        reason: blockForm.reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Horário bloqueado');
      setBlockForm({ startsAt: '', endsAt: '', reason: '' });
      setShowBlockForm(false);
      invalidate();
    },
    onError: (e) => toast.error('Não foi possível bloquear', apiErrorMessage(e)),
  });

  const removeBlockMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/professional/blocks/${id}`),
    onSuccess: () => {
      toast.success('Bloqueio liberado');
      invalidate();
    },
    onError: (e) => toast.error('Erro', apiErrorMessage(e)),
  });

  function dayItems(day: Date) {
    const key = format(day, 'yyyy-MM-dd');
    const apps = appointments
      .filter((a) => format(new Date(a.startsAt), 'yyyy-MM-dd') === key)
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    const blks = blocks.filter((b) => format(new Date(b.startsAt), 'yyyy-MM-dd') === key);
    return { apps, blks };
  }

  function handleReschedule(id: string) {
    const value = window.prompt('Nova data e hora (formato: AAAA-MM-DD HH:mm)');
    if (value) rescheduleMut.mutate({ id, startsAt: value.replace(' ', 'T') });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">
            {format(weekStart, "dd 'de' MMM", { locale: ptBR })} – {format(weekEnd, "dd 'de' MMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowBlockForm((v) => !v)}>
            <Ban className="h-4 w-4" /> Bloquear horário
          </Button>
        </div>
      </div>

      {showBlockForm && (
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-4">
            <div>
              <label className="text-xs text-muted-foreground">Início</label>
              <Input
                type="datetime-local"
                value={blockForm.startsAt}
                onChange={(e) => setBlockForm((f) => ({ ...f, startsAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fim</label>
              <Input
                type="datetime-local"
                value={blockForm.endsAt}
                onChange={(e) => setBlockForm((f) => ({ ...f, endsAt: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
              <Input
                value={blockForm.reason}
                onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Ex.: Almoço, Folga"
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={!blockForm.startsAt || !blockForm.endsAt || createBlockMut.isPending}
                onClick={() => createBlockMut.mutate()}
              >
                Confirmar bloqueio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => {
          const { apps, blks } = dayItems(day);
          return (
            <Card key={day.toISOString()} className="flex flex-col">
              <CardContent className="space-y-2 p-3">
                <p className="text-sm font-semibold capitalize">
                  {format(day, "EEE, dd/MM", { locale: ptBR })}
                </p>
                {apps.length === 0 && blks.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem agendamentos</p>
                )}
                {apps.map((a) => (
                  <div key={a.id} className="rounded-md border p-2 text-xs">
                    <p className="flex items-center gap-1 font-medium text-primary">
                      <Clock className="h-3 w-3" /> {formatTime(a.startsAt)}
                    </p>
                    <p className="font-medium">{a.patient.name}</p>
                    <p className="text-muted-foreground">{a.service.name}</p>
                    {a.status !== 'CANCELED' && a.status !== 'FINISHED' && (
                      <div className="mt-1 flex gap-1">
                        <button
                          className="rounded bg-secondary px-2 py-0.5 hover:bg-secondary/70"
                          onClick={() => handleReschedule(a.id)}
                        >
                          Remarcar
                        </button>
                        <button
                          className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-destructive hover:bg-destructive/20"
                          onClick={() => cancelMut.mutate(a.id)}
                        >
                          <X className="h-3 w-3" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {blks.map((b) => (
                  <div key={b.id} className="flex items-start justify-between rounded-md border border-dashed bg-muted/40 p-2 text-xs">
                    <div>
                      <p className="flex items-center gap-1 font-medium">
                        <Ban className="h-3 w-3" /> Bloqueado
                      </p>
                      <p className="text-muted-foreground">
                        {formatTime(b.startsAt)} - {formatTime(b.endsAt)}
                      </p>
                      {b.reason && <p className="text-muted-foreground">{b.reason}</p>}
                    </div>
                    <button className="text-destructive" onClick={() => removeBlockMut.mutate(b.id)} aria-label="Liberar">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
