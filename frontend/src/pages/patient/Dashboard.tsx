import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, CalendarCheck, Heart, History, MessageSquare, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDateTime, cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, SkeletonCards } from '@/components/ui/skeleton';
import { ClinicCard } from '@/components/ClinicCard';
import type { FeaturedClinics, PatientDashboard } from '@/types';

export function PatientDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['me', 'dashboard'],
    queryFn: async () => (await api.get<PatientDashboard>('/me/dashboard')).data,
  });

  const { data: featured, isLoading: loadingFeatured } = useQuery({
    queryKey: ['public', 'featured', user?.id],
    queryFn: async () => (await api.get<FeaturedClinics>('/public/clinics/featured')).data,
  });

  const next = data?.nextAppointment;

  const cards = [
    { to: '/meus-agendamentos', label: 'Meus Agendamentos', icon: CalendarCheck, value: next ? 'Próxima agendada' : 'Nenhuma' },
    { to: '/favoritos', label: 'Clínicas Favoritas', icon: Heart, value: `${data?.favoritesCount ?? 0} salvas` },
    { to: '/historico', label: 'Histórico', icon: History, value: `${data?.completedCount ?? 0} consultas` },
    { to: '/notificacoes', label: 'Notificações', icon: Bell, value: `${data?.unreadNotifications ?? 0} não lidas` },
  ];

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/clinicas?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground">Acompanhe suas consultas e encontre as melhores clínicas.</p>
      </div>

      <form onSubmit={submitSearch} className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por clínica, cidade, especialidade, serviço ou profissional..."
          className="pl-9"
        />
        <Button type="submit" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
          Buscar
        </Button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Próxima consulta</p>
            {isLoading ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : next ? (
              <div className="mt-2">
                <p className="text-lg font-semibold">{next.service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {next.clinic.name} · {next.professional.name}
                </p>
                <p className="mt-1 font-medium text-primary">{formatDateTime(next.startsAt)}</p>
                <Link to="/meus-agendamentos" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}>
                  Ver detalhes
                </Link>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-muted-foreground">Você não tem consultas agendadas.</p>
                <Link to="/clinicas" className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}>
                  Encontrar uma clínica
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid grid-cols-2 gap-4 p-5 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{data?.completedCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Consultas realizadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{data?.favoritesCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Favoritas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{data?.clinicsVisited ?? 0}</p>
              <p className="text-xs text-muted-foreground">Clínicas visitadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{data?.unreadNotifications ?? 0}</p>
              <p className="text-xs text-muted-foreground">Notificações</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="transition-all hover:border-primary hover:shadow-md">
              <CardContent className="flex flex-col gap-2 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <p className="font-semibold">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <FeaturedSection
        title="Mais bem avaliadas"
        clinics={featured?.topRated}
        loading={loadingFeatured}
      />
      <FeaturedSection title="Populares" clinics={featured?.popular} loading={loadingFeatured} />
      <FeaturedSection title="Novidades" clinics={featured?.nearby} loading={loadingFeatured} />
    </div>
  );
}

function FeaturedSection({
  title,
  clinics,
  loading,
}: {
  title: string;
  clinics?: FeaturedClinics['popular'];
  loading: boolean;
}) {
  if (!loading && (!clinics || clinics.length === 0)) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {loading ? (
        <SkeletonCards count={3} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clinics!.map((c) => (
            <ClinicCard key={c.id} clinic={c} />
          ))}
        </div>
      )}
    </section>
  );
}
