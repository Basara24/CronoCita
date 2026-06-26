import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Star,
  Stethoscope,
} from 'lucide-react';
import { API_URL, resolveAssetUrl } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FavoriteButton } from '@/components/FavoriteButton';
import type { PublicClinicDetail } from '@/types';

export function ClinicPage() {
  const { slug = '' } = useParams();

  const { data: clinic, isLoading, isError } = useQuery({
    queryKey: ['public', 'clinic', slug],
    queryFn: async () => (await axios.get<PublicClinicDetail>(`${API_URL}/public/clinics/${slug}`)).data,
    enabled: !!slug,
  });

  const mapsQuery = clinic
    ? encodeURIComponent(`${clinic.name}, ${clinic.address}, ${clinic.city} - ${clinic.state}`)
    : '';

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
          <ThemeToggle />
        </div>
      </header>

      {isLoading && (
        <div className="container max-w-5xl space-y-4 py-8">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {isError && <p className="container py-12 text-center text-destructive">Clínica não encontrada.</p>}

      {clinic && (
        <main className="container max-w-5xl py-6">
          <Link to="/" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ChevronLeft className="h-4 w-4" /> Voltar para a busca
          </Link>

          {/* Capa + cabeçalho */}
          <div className="overflow-hidden rounded-2xl border bg-card">
            <div className="relative h-44 bg-secondary sm:h-56">
              {clinic.coverImageUrl ? (
                <img src={resolveAssetUrl(clinic.coverImageUrl)} alt={clinic.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">Sem capa</div>
              )}
              <FavoriteButton clinicId={clinic.id} className="absolute right-4 top-4" />
            </div>

            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
              {clinic.logoUrl ? (
                <img
                  src={resolveAssetUrl(clinic.logoUrl)}
                  alt={clinic.name}
                  className="-mt-16 h-24 w-24 rounded-2xl border-4 border-card bg-card object-cover"
                />
              ) : (
                <div className="-mt-16 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-card bg-primary/10 text-primary">
                  <Stethoscope className="h-10 w-10" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold">{clinic.name}</h1>
                  {clinic.rating != null && (
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {Number(clinic.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {clinic.city} - {clinic.state} · <Phone className="h-3 w-3" /> {clinic.phone}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
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
            </div>
          </div>

          {clinic.description && (
            <p className="mt-6 text-sm text-muted-foreground">{clinic.description}</p>
          )}

          {/* Redes e site */}
          {(clinic.website || clinic.instagram || clinic.facebook) && (
            <div className="mt-4 flex items-center gap-4 text-sm">
              {clinic.website && (
                <a href={clinic.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Globe className="h-4 w-4" /> Site
                </a>
              )}
              {clinic.instagram && (
                <a href={clinic.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              )}
              {clinic.facebook && (
                <a href={clinic.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Facebook className="h-4 w-4" /> Facebook
                </a>
              )}
            </div>
          )}

          {/* Galeria */}
          {clinic.photos.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">Galeria</h2>
              <Gallery photos={clinic.photos.map((p) => resolveAssetUrl(p.url) ?? p.url)} />
            </section>
          )}

          {/* Profissionais e serviços */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3">
                        {s.imageUrl && (
                          <img src={resolveAssetUrl(s.imageUrl)} alt={s.name} className="h-12 w-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {s.durationMinutes} min
                          </p>
                        </div>
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

          {/* Localização — Google Maps sem chave */}
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Localização</h2>
              <a
                href={`https://maps.google.com/?q=${mapsQuery}`}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
              >
                <Navigation className="h-4 w-4" /> Como chegar
              </a>
            </div>
            <p className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> {clinic.address}, {clinic.city} - {clinic.state}, {clinic.zipCode}
            </p>
            <iframe
              title="Mapa da clínica"
              className="h-72 w-full rounded-xl border"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed`}
            />
          </section>
        </main>
      )}
    </div>
  );
}

function Gallery({ photos }: { photos: string[] }) {
  const [index, setIndex] = useState(0);
  if (photos.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border bg-secondary">
        <img src={photos[index]} alt={`Foto ${index + 1}`} className="h-72 w-full object-cover" />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow hover:bg-card"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow hover:bg-card"
              aria-label="Próxima"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p + i}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                'h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                i === index ? 'border-primary' : 'border-transparent',
              )}
            >
              <img src={p} alt={`Miniatura ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
