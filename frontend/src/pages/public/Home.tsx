import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  Stethoscope,
} from 'lucide-react';
import { API_URL, apiErrorMessage } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCards } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import type { FeaturedClinics, PublicClinicSummary } from '@/types';

export function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [searched, setSearched] = useState(false);

  const [contact, setContact] = useState({ name: '', email: '', subject: '', message: '' });

  const { data: specialties = [] } = useQuery({
    queryKey: ['public', 'specialties'],
    queryFn: async () => (await axios.get<string[]>(`${API_URL}/public/specialties`)).data,
  });

  const { data: featured, isLoading: loadingFeatured } = useQuery({
    queryKey: ['public', 'featured'],
    queryFn: async () => (await axios.get<FeaturedClinics>(`${API_URL}/public/clinics/featured`)).data,
  });

  const { data: clinics = [], isFetching } = useQuery({
    queryKey: ['public', 'clinics', filters],
    queryFn: async () =>
      (await axios.get<PublicClinicSummary[]>(`${API_URL}/public/clinics`, { params: filters })).data,
    enabled: searched,
  });

  const sendContact = useMutation({
    mutationFn: async () => axios.post(`${API_URL}/public/contact`, contact),
    onSuccess: () => {
      toast.success('Mensagem enviada!', 'Em breve entraremos em contato.');
      setContact({ name: '', email: '', subject: '', message: '' });
    },
    onError: (err) => toast.error('Não foi possível enviar', apiErrorMessage(err)),
  });

  function handleSearch() {
    setSearched(true);
    setFilters({
      name: name || undefined,
      city: city || undefined,
      specialty: specialty || undefined,
      q: q || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-primary">CronoCita</p>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link to="/minha-conta" className={cn(buttonVariants({ size: 'sm' }))}>
                Minha Conta
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                  Entrar
                </Link>
                <Link to="/register" className={cn(buttonVariants({ size: 'sm' }))}>
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero + busca inteligente */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-mint/10 py-14">
        <div className="container max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Encontre a clínica ideal para você
          </h1>
          <p className="mt-3 text-muted-foreground">
            Compare clínicas multidisciplinares, conheça os profissionais e agende sua consulta online.
          </p>

          <Card className="mt-8 text-left">
            <CardContent className="space-y-3 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  data-cy="search-smart"
                  placeholder="Busca inteligente: clínica, cidade, especialidade, serviço ou profissional..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Input
                  data-cy="search-name"
                  placeholder="Nome da clínica"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  data-cy="search-city"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
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
                <Button data-cy="search-submit" onClick={handleSearch}>
                  <Search className="h-4 w-4" /> Buscar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resultados da busca */}
      {searched && (
        <section className="container py-10">
          <h2 className="mb-5 text-xl font-semibold">
            {isFetching ? 'Buscando clínicas...' : `${clinics.length} clínica(s) encontrada(s)`}
          </h2>

          {isFetching ? (
            <SkeletonCards count={6} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinics.map((clinic) => (
                <PublicClinicCard key={clinic.id} clinic={clinic} />
              ))}
              {clinics.length === 0 && (
                <p className="col-span-full text-center text-muted-foreground">
                  Nenhuma clínica encontrada com os filtros selecionados.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Clínicas em destaque */}
      <section className="container space-y-8 py-10">
        <FeaturedRow title="⭐ Mais bem avaliadas" clinics={featured?.topRated} loading={loadingFeatured} />
        <FeaturedRow title="🔥 Populares" clinics={featured?.popular} loading={loadingFeatured} />
        <FeaturedRow title="🆕 Novas na plataforma" clinics={featured?.nearby} loading={loadingFeatured} />
      </section>

      {/* Fale Conosco */}
      <section id="fale-conosco" className="border-t bg-secondary/40 py-12">
        <div className="container grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">Fale Conosco</h2>
            <p className="mt-2 text-muted-foreground">
              Tem dúvidas ou quer cadastrar sua clínica? Envie uma mensagem.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> (44) 9 9183-6230
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> contato@cronocita.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Campo Mourão - PR, Brasil
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-primary hover:opacity-80">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-primary hover:opacity-80">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-5">
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendContact.mutate();
                }}
              >
                <Input
                  required
                  placeholder="Seu nome"
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                />
                <Input
                  required
                  type="email"
                  placeholder="Seu e-mail"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                />
                <Input
                  required
                  placeholder="Assunto"
                  value={contact.subject}
                  onChange={(e) => setContact((c) => ({ ...c, subject: e.target.value }))}
                />
                <textarea
                  required
                  placeholder="Mensagem"
                  rows={4}
                  value={contact.message}
                  onChange={(e) => setContact((c) => ({ ...c, message: e.target.value }))}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button type="submit" className="w-full" disabled={sendContact.isPending}>
                  {sendContact.isPending ? 'Enviando...' : 'Enviar mensagem'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        CronoCita · Plataforma de agendamento para clínicas multidisciplinares
      </footer>
    </div>
  );
}

function PublicClinicCard({ clinic }: { clinic: PublicClinicSummary }) {
  return (
    <Card data-cy="clinic-card" className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          {clinic.logoUrl ? (
            <img src={clinic.logoUrl} alt={clinic.name} className="h-12 w-12 rounded-lg object-cover" />
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
          {clinic.rating != null && (
            <span className="ml-auto flex items-center gap-1 text-sm font-semibold">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {Number(clinic.rating).toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {clinic.specialties.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>

        {clinic.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{clinic.description}</p>
        )}

        <div className="mt-auto flex gap-2 pt-2">
          <Link to={`/clinica/${clinic.slug}`} data-cy="clinic-view" className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}>
            Ver Detalhes
          </Link>
          <Link to={`/clinica/${clinic.slug}/agendar`} className={cn(buttonVariants(), 'flex-1')}>
            Agendar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedRow({
  title,
  clinics,
  loading,
}: {
  title: string;
  clinics?: PublicClinicSummary[];
  loading: boolean;
}) {
  if (!loading && (!clinics || clinics.length === 0)) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clinics!.map((c) => (
            <PublicClinicCard key={c.id} clinic={c} />
          ))}
        </div>
      )}
    </div>
  );
}
