import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  CalendarDays,
  ChevronLeft,
  Clock,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { API_URL } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PublicClinicDetail } from '@/types';

export function ClinicPage() {
  const { slug = '' } = useParams();

  const { data: clinic, isLoading, isError } = useQuery({
    queryKey: ['public', 'clinic', slug],
    queryFn: async () =>
      (await axios.get<PublicClinicDetail>(`${API_URL}/public/clinics/${slug}`)).data,
    enabled: !!slug,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-primary">CronoCita</p>
          </Link>
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Área da clínica
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <Link to="/" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Voltar para a busca
        </Link>

        {isLoading && <p className="text-muted-foreground">Carregando clínica...</p>}
        {isError && <p className="text-destructive">Clínica não encontrada.</p>}

        {clinic && (
          <div className="space-y-6">
            <Card>
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
                {clinic.logoUrl ? (
                  <img
                    src={clinic.logoUrl}
                    alt={clinic.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Stethoscope className="h-9 w-9" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{clinic.name}</h1>
                  {clinic.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{clinic.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {clinic.specialties.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </div>
                </div>
                <Link
                  to={`/clinica/${clinic.slug}/agendar`}
                  data-cy="schedule-button"
                  className={cn(buttonVariants({ size: 'lg' }))}
                >
                  Agendar Consulta
                </Link>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-start gap-2 p-4 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <span>
                    {clinic.address}
                    <br />
                    {clinic.city} - {clinic.state}, {clinic.zipCode}
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-2 p-4 text-sm">
                  <Phone className="h-4 w-4 text-primary" /> {clinic.phone}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-2 p-4 text-sm">
                  <Mail className="h-4 w-4 text-primary" /> {clinic.email}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h2 className="mb-3 text-lg font-semibold">Profissionais</h2>
                <div className="space-y-2">
                  {clinic.professionals.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.specialty}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {clinic.professionals.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum profissional cadastrado.</p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-lg font-semibold">Serviços</h2>
                <div className="space-y-2">
                  {clinic.services.map((s) => (
                    <Card key={s.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {s.durationMinutes} min
                          </p>
                        </div>
                        <p className="font-semibold text-primary">{formatCurrency(s.price)}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {clinic.services.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
