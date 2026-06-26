import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  clinicId: string;
  className?: string;
}

export function FavoriteButton({ clinicId, className }: FavoriteButtonProps) {
  const { isFavorite, toggle, enabled } = useFavorites();
  const toast = useToast();

  if (!enabled) return null;

  const active = isFavorite(clinicId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(clinicId);
        toast.success(active ? 'Removida dos favoritos' : 'Adicionada aos favoritos');
      }}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow transition-colors hover:bg-card',
        className,
      )}
    >
      <Heart
        className={cn('h-5 w-5 transition-colors', active ? 'fill-destructive text-destructive' : 'text-muted-foreground')}
      />
    </button>
  );
}
