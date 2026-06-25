import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CalendarDays, MapPin, Search, Stethoscope } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PublicClinicSummary } from '@/types';

export function Home() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [filters, setFilters] = useState<{ name?: string; city?: string; specialty?: string }>({});

  const { data: specialties = [] } = useQuery({
    queryKey: ['public', 'specialties'],
    queryFn: async () => (await axios.get<string[]>(`${API_URL}/public/specialties`)).data,
  });

  const { data: clinics = [], isFetching } = useQuery({
    queryKey: ['public', 'clinics', filters],
    queryFn: async () =>
      (await axios.get<PublicClinicSummary[]>(`${API_URL}/public/clinics`, { params: filters })).data,
  });

  function handleSearch() {
    setFilters({
      name: name || undefined,
      city: city || undefined,
      specialty: specialty || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-primary">CronoCita</p>
          </div>
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Área da clínica
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-mint/10 py-14">
        <div className="container max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Encontre a clínica ideal para você
          </h1>
          <p className="mt-3 text-muted-foreground">
            Compare clínicas multidisciplinares, conheça os profissionais e agende sua consulta online.
          </p>

          <Card className="mt-8 text-left">
            <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
              <div className="md:col-span-1">
                <Input
                  data-cy="search-name"
                  placeholder="Nome da clínica"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  data-cy="search-city"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="md:col-span-1">
                <select
                  data-cy="search-specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Todas especialidades</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <Button data-cy="search-submit" onClick={handleSearch} className="md:col-span-1">
                <Search className="h-4 w-4" /> Buscar
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Lista de clínicas */}
      <section className="container py-10">
        <h2 className="mb-5 text-xl font-semibold">
          {isFetching ? 'Buscando clínicas...' : `${clinics.length} clínica(s) encontrada(s)`}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <Card key={clinic.id} data-cy="clinic-card" className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  {clinic.logoUrl ? (
                    <img
                      src={clinic.logoUrl}
                      alt={clinic.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold leading-tight">{clinic.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {clinic.city} - {clinic.state}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {clinic.specialties.map((s) => (
                    <Badge key={s}>{s}</Badge>
                  ))}
                </div>

                {clinic.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{clinic.description}</p>
                )}

                <div className="mt-auto pt-2">
                  <Link
                    to={`/clinica/${clinic.slug}`}
                    data-cy="clinic-view"
                    className={cn(buttonVariants(), 'w-full')}
                  >
                    Ver Clínica
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}

          {!isFetching && clinics.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              Nenhuma clínica encontrada com os filtros selecionados.
            </p>
          )}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        CronoCita · Plataforma de agendamento para clínicas multidisciplinares
      </footer>
    </div>
  );
}
