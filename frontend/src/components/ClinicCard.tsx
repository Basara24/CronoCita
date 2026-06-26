import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { FavoriteButton } from '@/components/FavoriteButton';
import type { FavoriteClinic, PublicClinicSummary } from '@/types';

type ClinicLike = FavoriteClinic | PublicClinicSummary;

export function ClinicCard({ clinic }: { clinic: ClinicLike }) {
  const cover = resolveAssetUrl((clinic as FavoriteClinic).coverImageUrl) ?? resolveAssetUrl(clinic.logoUrl);
  const rating = (clinic as FavoriteClinic).rating;

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary hover:shadow-md">
      <div className="relative h-32 bg-secondary">
        {cover ? (
          <img src={cover} alt={clinic.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">Sem imagem</div>
        )}
        <FavoriteButton clinicId={clinic.id} className="absolute right-2 top-2" />
        {rating != null && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-xs font-semibold shadow">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {Number(rating).toFixed(1)}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start gap-3">
          {clinic.logoUrl && (
            <img
              src={resolveAssetUrl(clinic.logoUrl)}
              alt={clinic.name}
              className="-mt-8 h-12 w-12 rounded-lg border-2 border-card bg-card object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{clinic.name}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> {clinic.city}/{clinic.state}
            </p>
          </div>
        </div>

        {clinic.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clinic.specialties.slice(0, 3).map((s) => (
              <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Link
            to={`/clinica/${clinic.slug}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1')}
          >
            Ver Detalhes
          </Link>
          <Link
            to={`/clinica/${clinic.slug}/agendar`}
            className={cn(buttonVariants({ size: 'sm' }), 'flex-1')}
          >
            Agendar
          </Link>
        </div>
      </div>
    </div>
  );
}
