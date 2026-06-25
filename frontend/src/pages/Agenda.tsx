import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatDateTime, formatTime } from '@/lib/utils';
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
import type { Appointment, AppointmentStatus, Patient, Professional, Service } from '@/types';

const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 56; // px por hora
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-primary/15 border-primary text-primary',
  CONFIRMED: 'bg-mint/15 border-mint text-mint',
  CANCELED: 'bg-muted border-muted-foreground/40 text-muted-foreground line-through',
  FINISHED: 'bg-emerald-100 border-emerald-500 text-emerald-700',
  NO_SHOW: 'bg-amber-100 border-amber-500 text-amber-700',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
  FINISHED: 'Finalizado',
  NO_SHOW: 'Falta',
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

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
      invalidate();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, startsAt }: { id: string; startsAt: Date }) =>
      api.put(`/appointments/${id}/reschedule`, { startsAt: startsAt.toISOString() }),
    onSuccess: () => invalidate(),
    onError: (err) => window.alert(apiErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) =>
      api.patch(`/appointments/${id}/status`, { status }),
    onSuccess: () => {
      setSelected(null);
      invalidate();
    },
    onError: (err) => window.alert(apiErrorMessage(err)),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewAppointmentForm>({ resolver: zodResolver(newAppointmentSchema) });

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dayIndex: number) {
    e.preventDefault();
    if (!canManage) return;
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromStart = Math.max(0, Math.round((y / HOUR_HEIGHT) * 60 / 30) * 30);

    const startsAt = addDays(weekStart, dayIndex);
    startsAt.setHours(START_HOUR, minutesFromStart, 0, 0);

    rescheduleMutation.mutate({ id, startsAt });
  }

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {weekStart.toLocaleDateString('pt-BR')} — {addDays(weekStart, 6).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addDays(w, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addDays(w, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {canManage && (
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
          )}
        </div>
      </div>

      {/* Grade semanal estilo Google Calendar */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
            <div />
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(weekStart, i);
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div
                  key={i}
                  className={cn(
                    'border-l p-2 text-center text-sm',
                    isToday && 'bg-primary/5 font-semibold text-primary',
                  )}
                >
                  <p className="text-xs text-muted-foreground">{DAYS_OF_WEEK[day.getDay()]}</p>
                  <p>{day.getDate()}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            <div>
              {hours.map((h) => (
                <div
                  key={h}
                  className="relative border-b text-right text-[11px] text-muted-foreground"
                  style={{ height: HOUR_HEIGHT }}
                >
                  <span className="absolute -top-2 right-1">{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {Array.from({ length: 7 }, (_, dayIndex) => {
              const day = addDays(weekStart, dayIndex);
              const dayAppointments = appointments.filter(
                (a) => new Date(a.startsAt).toDateString() === day.toDateString(),
              );

              return (
                <div
                  key={dayIndex}
                  className="relative border-l"
                  style={{ height: hours.length * HOUR_HEIGHT }}
                  onDragOver={(e) => canManage && e.preventDefault()}
                  onDrop={(e) => handleDrop(e, dayIndex)}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-b border-dashed border-border/60"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}

                  {dayAppointments.map((a) => {
                    const start = new Date(a.startsAt);
                    const end = new Date(a.endsAt);
                    const top =
                      ((start.getHours() - START_HOUR) * 60 + start.getMinutes()) *
                      (HOUR_HEIGHT / 60);
                    const height = Math.max(
                      24,
                      ((end.getTime() - start.getTime()) / 60_000) * (HOUR_HEIGHT / 60),
                    );

                    return (
                      <button
                        key={a.id}
                        data-cy="appointment-card"
                        draggable={canManage && a.status !== 'CANCELED' && a.status !== 'FINISHED'}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', a.id)}
                        onClick={() => setSelected(a)}
                        className={cn(
                          'absolute left-1 right-1 z-10 overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-[11px] leading-tight shadow-sm transition-shadow hover:shadow-md',
                          STATUS_STYLES[a.status],
                        )}
                        style={{ top, height }}
                      >
                        <p className="truncate font-semibold">{a.patient.name}</p>
                        <p className="truncate">
                          {formatTime(a.startsAt)} · {a.service.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {canManage
          ? 'Dica: arraste um agendamento para outro horário para remarcá-lo.'
          : 'Clique em um agendamento para ver os detalhes.'}
      </p>

      {/* Dialog: novo agendamento */}
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

      {/* Dialog: detalhes do agendamento */}
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
