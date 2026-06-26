import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { FavoriteClinic } from '@/types';

const KEY = ['me', 'favorites'];

/** Lista e gerencia clínicas favoritas do paciente logado. */
export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const enabled = user?.role === 'PATIENT';

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<FavoriteClinic[]>('/me/favorites')).data,
    enabled,
  });

  const ids = new Set(favorites.map((f) => f.id));

  const toggle = useMutation({
    mutationFn: async (clinicId: string) => {
      if (ids.has(clinicId)) {
        await api.delete(`/me/favorites/${clinicId}`);
        return { clinicId, favorited: false };
      }
      await api.post(`/me/favorites/${clinicId}`);
      return { clinicId, favorited: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      queryClient.invalidateQueries({ queryKey: ['me', 'dashboard'] });
    },
  });

  return {
    favorites,
    isLoading,
    isFavorite: (clinicId: string) => ids.has(clinicId),
    toggle: (clinicId: string) => toggle.mutate(clinicId),
    toggling: toggle.isPending,
    enabled,
  };
}
