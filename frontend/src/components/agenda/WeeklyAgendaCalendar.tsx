import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { AppointmentStatus, ScheduleBlock } from '@/types';

export const START_HOUR = 8;
export const END_HOUR = 18;
export const HOUR_HEIGHT = 56;
export const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const STATUS_STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-primary/15 border-primary text-primary',
  CONFIRMED: 'bg-mint/15 border-mint text-mint',
  CANCELED: 'bg-muted border-muted-foreground/40 text-muted-foreground line-through',
  FINISHED: 'bg-emerald-100 border-emerald-500 text-emerald-700',
  NO_SHOW: 'bg-amber-100 border-amber-500 text-amber-700',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  CANCELED: 'Cancelado',
  FINISHED: 'Finalizado',
  NO_SHOW: 'Falta',
};

export interface CalendarAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  patient: { id: string; name: string; userId?: string | null };
  service: { name: string };
  room?: { name: string } | null;
  professional?: { name: string };
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

interface WeeklyAgendaCalendarProps {
  weekStart: Date;
  onWeekChange: (start: Date) => void;
  appointments: CalendarAppointment[];
  blocks?: ScheduleBlock[];
  canDragDrop?: boolean;
  onAppointmentClick: (appointment: CalendarAppointment) => void;
  onReschedule?: (id: string, startsAt: Date) => void;
  headerExtra?: React.ReactNode;
  dragHint?: string;
}

export function WeeklyAgendaCalendar({
  weekStart,
  onWeekChange,
  appointments,
  blocks = [],
  canDragDrop = false,
  onAppointmentClick,
  onReschedule,
  headerExtra,
  dragHint,
}: WeeklyAgendaCalendarProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const today = new Date();

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dayIndex: number) {
    e.preventDefault();
    if (!canDragDrop || !onReschedule) return;
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromStart = Math.max(0, Math.round((y / HOUR_HEIGHT) * 60 / 30) * 30);

    const startsAt = addDays(weekStart, dayIndex);
    startsAt.setHours(START_HOUR, minutesFromStart, 0, 0);

    onReschedule(id, startsAt);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {weekStart.toLocaleDateString('pt-BR')} — {addDays(weekStart, 6).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => onWeekChange(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => onWeekChange(startOfWeek(new Date()))}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => onWeekChange(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {headerExtra}
        </div>
      </div>

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
              const dayBlocks = blocks.filter(
                (b) => new Date(b.startsAt).toDateString() === day.toDateString(),
              );

              return (
                <div
                  key={dayIndex}
                  className="relative border-l"
                  style={{ height: hours.length * HOUR_HEIGHT }}
                  onDragOver={(e) => canDragDrop && e.preventDefault()}
                  onDrop={(e) => handleDrop(e, dayIndex)}
                >
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="border-b border-dashed border-border/60"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}

                  {dayBlocks.map((b) => {
                    const start = new Date(b.startsAt);
                    const end = new Date(b.endsAt);
                    const top =
                      ((start.getHours() - START_HOUR) * 60 + start.getMinutes()) *
                      (HOUR_HEIGHT / 60);
                    const height = Math.max(
                      20,
                      ((end.getTime() - start.getTime()) / 60_000) * (HOUR_HEIGHT / 60),
                    );

                    return (
                      <div
                        key={b.id}
                        className="absolute left-1 right-1 z-[5] overflow-hidden rounded-md border border-dashed border-muted-foreground/50 bg-muted/60 px-2 py-1 text-[10px] text-muted-foreground"
                        style={{ top, height }}
                      >
                        <p className="truncate font-semibold">Bloqueado</p>
                        {b.reason && <p className="truncate">{b.reason}</p>}
                      </div>
                    );
                  })}

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
                        type="button"
                        draggable={
                          canDragDrop && a.status !== 'CANCELED' && a.status !== 'FINISHED'
                        }
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', a.id)}
                        onClick={() => onAppointmentClick(a)}
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
                        {a.room && <p className="truncate opacity-80">{a.room.name}</p>}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {dragHint && <p className="text-xs text-muted-foreground">{dragHint}</p>}
    </div>
  );
}
