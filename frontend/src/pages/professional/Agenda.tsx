import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Ban, MessageSquare, User } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import {
  WeeklyAgendaCalendar,
  STATUS_LABELS,
  addDays,
  startOfWeek,
  type CalendarAppointment,
} from '@/components/agenda/WeeklyAgendaCalendar';
import type { Appointment, AppointmentStatus, ScheduleBlock } from '@/types';

export function ProfessionalAgendaPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [blockForm, setBlockForm] = useState({ startsAt: '', endsAt: '', reason: '' });
  const [showBlockForm, setShowBlockForm] = useState(false);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const params = { from: weekStart.toISOString(), to: weekEnd.toISOString() };

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', weekStart.toISOString()],
    queryFn: async () =>
      (await api.get<Appointment[]>('/appointments', { params })).data,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['professional', 'blocks', params],
    queryFn: async () => (await api.get<ScheduleBlock[]>('/professional/blocks', { params })).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['professional', 'blocks'] });
  }

  const cancelMut = useMutation({
    mutationFn: async (id: string) => api.patch(`/professional/appointments/${id}/cancel`),
    onSuccess: () => {
      toast.success('Consulta cancelada.');
      setSelected(null);
      invalidate();
    },
    onError: (e) => toast.error('Erro ao cancelar', apiErrorMessage(e)),
  });

  const rescheduleMut = useMutation({
    mutationFn: async ({ id, startsAt }: { id: string; startsAt: Date }) =>
      api.patch(`/professional/appointments/${id}/reschedule`, { startsAt: startsAt.toISOString() }),
    onSuccess: () => {
      toast.success('Consulta remarcada.');
      invalidate();
    },
    onError: (e) => toast.error('Não foi possível remarcar', apiErrorMessage(e)),
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch(`/appointments/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status atualizado.');
      setSelected(null);
      invalidate();
    },
    onError: (e) => toast.error('Erro ao atualizar status', apiErrorMessage(e)),
  });

  const createBlockMut = useMutation({
    mutationFn: async () =>
      api.post('/professional/blocks', {
        startsAt: new Date(blockForm.startsAt).toISOString(),
        endsAt: new Date(blockForm.endsAt).toISOString(),
        reason: blockForm.reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Horário bloqueado.');
      setBlockForm({ startsAt: '', endsAt: '', reason: '' });
      setShowBlockForm(false);
      invalidate();
    },
    onError: (e) => toast.error('Não foi possível bloquear', apiErrorMessage(e)),
  });

  const removeBlockMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/professional/blocks/${id}`),
    onSuccess: () => {
      toast.success('Bloqueio liberado.');
      invalidate();
    },
    onError: (e) => toast.error('Erro ao liberar bloqueio', apiErrorMessage(e)),
  });

  function handleAppointmentClick(a: CalendarAppointment) {
    const full = appointments.find((ap) => ap.id === a.id);
    if (full) setSelected(full);
  }

  function openConversation() {
    if (!selected) return;
    const userId = selected.patient.userId;
    if (!userId) {
      toast.error('Este paciente não possui conta vinculada para mensagens.');
      return;
    }
    navigate(`/profissional/mensagens?with=${userId}`);
  }

  function viewPatient() {
    if (!selected) return;
    navigate(`/profissional/pacientes?highlight=${selected.patientId}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Agenda</h1>
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
            <div className="flex items-end gap-2">
              <Button
                className="flex-1"
                disabled={!blockForm.startsAt || !blockForm.endsAt || createBlockMut.isPending}
                onClick={() => createBlockMut.mutate()}
              >
                Confirmar bloqueio
              </Button>
              <Button variant="outline" onClick={() => setShowBlockForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {blocks.length > 0 && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium">Bloqueios da semana</p>
            <div className="flex flex-wrap gap-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-xs"
                >
                  <Ban className="h-3 w-3 text-muted-foreground" />
                  <span>
                    {formatDateTime(b.startsAt)} — {b.reason ?? 'Bloqueado'}
                  </span>
                  <button
                    type="button"
                    className="text-destructive hover:underline"
                    onClick={() => removeBlockMut.mutate(b.id)}
                  >
                    Liberar
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <WeeklyAgendaCalendar
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        appointments={appointments}
        blocks={blocks}
        canDragDrop
        onAppointmentClick={handleAppointmentClick}
        onReschedule={(id, startsAt) => rescheduleMut.mutate({ id, startsAt })}
        headerExtra={
          <Button onClick={() => setShowBlockForm((v) => !v)}>
            <Ban className="h-4 w-4" /> Bloquear horário
          </Button>
        }
        dragHint="Dica: arraste um agendamento para outro horário para remarcá-lo."
      />

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.patient.name}
                  <Badge variant="muted">{STATUS_LABELS[selected.status]}</Badge>
                </DialogTitle>
                <DialogDescription>{formatDateTime(selected.startsAt)}</DialogDescription>
              </DialogHeader>

              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Serviço:</span> {selected.service.name}
                </p>
                {selected.room && (
                  <p>
                    <span className="text-muted-foreground">Sala:</span> {selected.room.name}
                  </p>
                )}
              </div>

              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={openConversation}>
                  <MessageSquare className="h-4 w-4" /> Abrir Conversa
                </Button>
                <Button variant="outline" size="sm" onClick={viewPatient}>
                  <User className="h-4 w-4" /> Ver Paciente
                </Button>

                {(selected.status === 'SCHEDULED' || selected.status === 'CONFIRMED') && (
                  <>
                    {selected.status === 'SCHEDULED' && (
                      <Button
                        variant="mint"
                        size="sm"
                        onClick={() => statusMut.mutate({ id: selected.id, status: 'CONFIRMED' })}
                      >
                        Confirmar
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => statusMut.mutate({ id: selected.id, status: 'FINISHED' })}
                    >
                      Finalizar Consulta
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => cancelMut.mutate(selected.id)}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
