import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, Check, ChevronLeft, Loader2 } from 'lucide-react';
import { API_URL, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatCurrency, formatDateTime, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface PublicProfessional {
  id: string;
  name: string;
  specialty: string;
}

interface PublicService {
  id: string;
  name: string;
  durationMinutes: number;
  price: string | number;
}

const patientSchema = z.object({
  name: z.string().min(3, 'Informe seu nome completo'),
  cpf: z.string().min(11, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
});

type PatientForm = z.infer<typeof patientSchema>;

type Step = 'specialty' | 'professional' | 'datetime' | 'confirm' | 'done';

const STEP_TITLES: Record<Step, string> = {
  specialty: 'Escolha a especialidade',
  professional: 'Escolha o profissional',
  datetime: 'Escolha data e horário',
  confirm: 'Confirme seus dados',
  done: 'Agendamento confirmado!',
};

function nextDays(count: number): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export function PublicBooking() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('specialty');
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [professional, setProfessional] = useState<PublicProfessional | null>(null);
  const [service, setService] = useState<PublicService | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ startsAt: string } | null>(null);

  const days = useMemo(() => nextDays(14), []);

  const { data: clinic } = useQuery({
    queryKey: ['public', 'clinic', slug],
    queryFn: async () =>
      (await axios.get<{ name: string }>(`${API_URL}/public/clinics/${slug}`)).data,
    enabled: !!slug,
  });

  const { data: specialties = [] } = useQuery({
    queryKey: ['public', 'clinic-specialties', slug],
    queryFn: async () =>
      (await axios.get<PublicProfessional[]>(`${API_URL}/public/clinics/${slug}/professionals`)).data
        .map((p) => p.specialty)
        .filter((value, index, arr) => arr.indexOf(value) === index),
    enabled: !!slug,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['public', 'clinic-professionals', slug, specialty],
    queryFn: async () =>
      (
        await axios.get<PublicProfessional[]>(`${API_URL}/public/clinics/${slug}/professionals`, {
          params: { specialty },
        })
      ).data,
    enabled: !!slug && !!specialty,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['public', 'clinic-services', slug],
    queryFn: async () =>
      (await axios.get<PublicService[]>(`${API_URL}/public/clinics/${slug}/services`)).data,
    enabled: !!slug,
  });

  const dateISO = date ? date.toISOString().slice(0, 10) : null;

  const { data: slots = [], isFetching: loadingSlots } = useQuery({
    queryKey: ['public', 'availability', slug, professional?.id, service?.id, dateISO],
    queryFn: async () =>
      (
        await axios.get<string[]>(`${API_URL}/public/clinics/${slug}/availability`, {
          params: { professionalId: professional!.id, serviceId: service!.id, date: dateISO },
        })
      ).data,
    enabled: !!slug && !!professional && !!service && !!dateISO,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    values:
      user && user.role === 'PATIENT'
        ? {
            name: user.name,
            cpf: user.cpf ?? '',
            email: user.email,
            phone: user.phone ?? '',
          }
        : undefined,
  });

  async function onConfirm(patient: PatientForm) {
    if (!professional || !service || !slot) return;
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API_URL}/public/clinics/${slug}/appointments`, {
        professionalId: professional.id,
        serviceId: service.id,
        startsAt: slot,
        patient,
      });
      setConfirmation({ startsAt: data.startsAt });
      setStep('done');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    setError(null);
    if (step === 'professional') setStep('specialty');
    else if (step === 'datetime') setStep('professional');
    else if (step === 'confirm') setStep('datetime');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-mint/10">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-primary">CronoCita</p>
          </div>
          <Link to={`/clinica/${slug}`} className="text-sm font-medium text-primary hover:underline">
            Voltar à clínica
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        <div className="mb-6 text-center">
          {clinic && <p className="text-sm font-medium text-primary">{clinic.name}</p>}
          <h1 className="text-2xl font-bold">{STEP_TITLES[step]}</h1>
          {step !== 'done' && (
            <p className="text-sm text-muted-foreground">
              Agende sua consulta online em poucos cliques
            </p>
          )}
        </div>

        {step !== 'specialty' && step !== 'done' && (
          <Button variant="ghost" size="sm" className="mb-4" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
        )}

        {/* Passo 1 — especialidade */}
        {step === 'specialty' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {specialties.map((s) => (
              <Card
                key={s}
                data-cy="specialty-option"
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                onClick={() => {
                  setSpecialty(s);
                  setStep('professional');
                }}
              >
                <CardContent className="p-5 text-center font-medium">{s}</CardContent>
              </Card>
            ))}
            {specialties.length === 0 && (
              <p className="col-span-2 text-center text-muted-foreground">
                Carregando especialidades...
              </p>
            )}
          </div>
        )}

        {/* Passo 2 — profissional + serviço */}
        {step === 'professional' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {professionals.map((p) => (
                <Card
                  key={p.id}
                  data-cy="professional-option"
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                    professional?.id === p.id && 'border-primary ring-2 ring-primary/30',
                  )}
                  onClick={() => setProfessional(p)}
                >
                  <CardContent className="p-5">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.specialty}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {professional && (
              <div className="space-y-2">
                <Label>Serviço</Label>
                <div className="grid grid-cols-1 gap-2">
                  {services.map((s) => (
                    <Card
                      key={s.id}
                      data-cy="service-option"
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        service?.id === s.id && 'border-primary ring-2 ring-primary/30',
                      )}
                      onClick={() => setService(s)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.durationMinutes} min</p>
                        </div>
                        <p className="font-semibold text-primary">{formatCurrency(s.price)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!professional || !service}
              onClick={() => setStep('datetime')}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Passo 3 — data e horário */}
        {step === 'datetime' && (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Data</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button
                    key={d.toISOString()}
                    data-cy="date-option"
                    onClick={() => {
                      setDate(d);
                      setSlot(null);
                    }}
                    className={cn(
                      'flex min-w-[64px] flex-col items-center rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:border-primary',
                      date?.toDateString() === d.toDateString() &&
                        'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    <span className="text-[11px] uppercase">
                      {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-lg font-bold">{d.getDate()}</span>
                    <span className="text-[11px]">
                      {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {date && (
              <div>
                <Label className="mb-2 block">Horário</Label>
                {loadingSlots ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Buscando horários...
                  </p>
                ) : slots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {slots.map((s) => (
                      <button
                        key={s}
                        data-cy="slot-option"
                        onClick={() => setSlot(s)}
                        className={cn(
                          'rounded-md border bg-card px-2 py-2 text-sm font-medium transition-colors hover:border-primary',
                          slot === s && 'border-primary bg-primary text-primary-foreground',
                        )}
                      >
                        {formatTime(s)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário disponível nesta data. Tente outro dia.
                  </p>
                )}
              </div>
            )}

            <Button className="w-full" disabled={!slot} onClick={() => setStep('confirm')}>
              Continuar
            </Button>
          </div>
        )}

        {/* Passo 4 — dados do paciente e confirmação */}
        {step === 'confirm' && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-md bg-secondary p-3 text-sm">
                <p className="font-semibold text-secondary-foreground">{service?.name}</p>
                <p className="text-secondary-foreground">
                  {professional?.name} · {slot && formatDateTime(slot)}
                </p>
              </div>

              <form onSubmit={handleSubmit(onConfirm)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nome completo</Label>
                  <Input data-cy="patient-name" {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>CPF</Label>
                    <Input data-cy="patient-cpf" placeholder="000.000.000-00" {...register('cpf')} />
                    {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telefone</Label>
                    <Input data-cy="patient-phone" placeholder="(11) 99999-9999" {...register('phone')} />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input data-cy="patient-email" type="email" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                {error && (
                  <p
                    data-cy="booking-error"
                    className="rounded-md bg-destructive/10 p-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={submitting} data-cy="confirm-booking">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar agendamento
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Passo 5 — confirmação */}
        {step === 'done' && confirmation && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-mint-foreground">
                <Check className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-semibold" data-cy="booking-success">
                  Sua consulta foi agendada!
                </p>
                <p className="text-sm text-muted-foreground">
                  {service?.name} com {professional?.name}
                </p>
                <p className="mt-1 font-medium text-primary">
                  {formatDateTime(confirmation.startsAt)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Você receberá um lembrete pelo WhatsApp antes da consulta.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('specialty');
                  setSpecialty(null);
                  setProfessional(null);
                  setService(null);
                  setDate(null);
                  setSlot(null);
                  setConfirmation(null);
                }}
              >
                Fazer novo agendamento
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
