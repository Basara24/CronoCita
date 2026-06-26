import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { SkeletonCards } from '@/components/ui/skeleton';
import { ClinicCard } from '@/components/ClinicCard';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PatientFavoritesPage() {
  const { favorites, isLoading } = useFavorites();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clínicas Favoritas</h1>
        <p className="text-muted-foreground">As clínicas que você salvou para acesso rápido.</p>
      </div>

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Nenhuma clínica favoritada ainda</p>
          <p className="text-sm text-muted-foreground">Explore o marketplace e salve suas clínicas preferidas.</p>
          <Link to="/clinicas" className={cn(buttonVariants({ size: 'sm' }), 'mt-4')}>
            Explorar clínicas
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((c) => (
            <ClinicCard key={c.id} clinic={c} />
          ))}
        </div>
      )}
    </div>
  );
}
