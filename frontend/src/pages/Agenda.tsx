import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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
import type { Appointment, AppointmentStatus, Patient, Professional, Service } from '@/types';

const newAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecione o paciente'),
  professionalId: z.string().min(1, 'Selecione o profissional'),
  serviceId: z.string().min(1, 'Selecione o serviço'),
  date: z.string().min(1, 'Informe a data'),
  time: z.string().min(1, 'Informe o horário'),
});

type NewAppointmentForm = z.infer<typeof newAppointmentSchema>;

export function Agenda() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'CLINIC_ADMIN' || user?.role === 'SECRETARY';
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', weekStart.toISOString()],
    queryFn: async () =>
      (
        await api.get<Appointment[]>('/appointments', {
          params: { from: weekStart.toISOString(), to: weekEnd.toISOString() },
        })
      ).data,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => (await api.get<Patient[]>('/patients')).data,
    enabled: canManage,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => (await api.get<Professional[]>('/professionals')).data,
    enabled: canManage,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await api.get<Service[]>('/services')).data,
    enabled: canManage,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['appointments'] });

  const createMutation = useMutation({
    mutationFn: async (form: NewAppointmentForm) => {
      const startsAt = new Date(`${form.date}T${form.time}:00`);
      return api.post('/appointments', {
        patientId: form.patientId,
        professionalId: form.professionalId,
        serviceId: form.serviceId,
        startsAt: startsAt.toISOString(),
      });
    },
    onSuccess: () => {
      setCreating(false);
      setError(null);
      toast.success('Agendamento criado.');
      invalidate();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, startsAt }: { id: string; startsAt: Date }) =>
      api.put(`/appointments/${id}/reschedule`, { startsAt: startsAt.toISOString() }),
    onSuccess: () => {
      toast.success('Consulta remarcada.');
      invalidate();
    },
    onError: (err) => toast.error('Não foi possível remarcar', apiErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch(`/appointments/${id}/status`, { status }),
    onSuccess: () => {
      setSelected(null);
      toast.success('Status atualizado.');
      invalidate();
    },
    onError: (err) => toast.error('Erro ao atualizar status', apiErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewAppointmentForm>({ resolver: zodResolver(newAppointmentSchema) });

  function handleAppointmentClick(a: CalendarAppointment) {
    const full = appointments.find((ap) => ap.id === a.id);
    if (full) setSelected(full);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Agenda</h1>
      </div>

      <WeeklyAgendaCalendar
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        appointments={appointments}
        canDragDrop={canManage}
        onAppointmentClick={handleAppointmentClick}
        onReschedule={(id, startsAt) => rescheduleMutation.mutate({ id, startsAt })}
        headerExtra={
          canManage ? (
            <Button
              data-cy="new-appointment"
              onClick={() => {
                reset();
                setError(null);
                setCreating(true);
              }}
            >
              <Plus className="h-4 w-4" /> Novo agendamento
            </Button>
          ) : undefined
        }
        dragHint={
          canManage
            ? 'Dica: arraste um agendamento para outro horário para remarcá-lo.'
            : 'Clique em um agendamento para ver os detalhes.'
        }
      />

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
            <DialogDescription>
              A sala e o equipamento são alocados automaticamente conforme o serviço.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Paciente</Label>
              <Select data-cy="select-patient" {...register('patientId')}>
                <option value="">Selecione...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              {errors.patientId && (
                <p className="text-xs text-destructive">{errors.patientId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Profissional</Label>
              <Select data-cy="select-professional" {...register('professionalId')}>
                <option value="">Selecione...</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.specialty}
                  </option>
                ))}
              </Select>
              {errors.professionalId && (
                <p className="text-xs text-destructive">{errors.professionalId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <Select data-cy="select-service" {...register('serviceId')}>
                <option value="">Selecione...</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes}min)
                  </option>
                ))}
              </Select>
              {errors.serviceId && (
                <p className="text-xs text-destructive">{errors.serviceId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input data-cy="input-date" type="date" {...register('date')} />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Horário</Label>
                <Input data-cy="input-time" type="time" {...register('time')} />
                {errors.time && <p className="text-xs text-destructive">{errors.time.message}</p>}
              </div>
            </div>

            {error && (
              <p
                data-cy="appointment-error"
                className="rounded-md bg-destructive/10 p-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" data-cy="save-appointment" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                <p>
                  <span className="text-muted-foreground">Profissional:</span>{' '}
                  {selected.professional.name}
                </p>
                {selected.room && (
                  <p>
                    <span className="text-muted-foreground">Sala:</span> {selected.room.name}
                  </p>
                )}
                {selected.equipment && (
                  <p>
                    <span className="text-muted-foreground">Equipamento:</span>{' '}
                    {selected.equipment.name}
                  </p>
                )}
              </div>

              {(selected.status === 'SCHEDULED' || selected.status === 'CONFIRMED') && (
                <DialogFooter className="flex-wrap">
                  {(user?.role === 'PROFESSIONAL' || canManage) &&
                    selected.status === 'SCHEDULED' && (
                      <Button
                        variant="mint"
                        size="sm"
                        onClick={() =>
                          statusMutation.mutate({ id: selected.id, status: 'CONFIRMED' })
                        }
                      >
                        Confirmar
                      </Button>
                    )}
                  {(user?.role === 'PROFESSIONAL' || canManage) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        statusMutation.mutate({ id: selected.id, status: 'FINISHED' })
                      }
                    >
                      Finalizar
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        statusMutation.mutate({ id: selected.id, status: 'NO_SHOW' })
                      }
                    >
                      No-show
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => statusMutation.mutate({ id: selected.id, status: 'CANCELED' })}
                  >
                    Cancelar consulta
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
