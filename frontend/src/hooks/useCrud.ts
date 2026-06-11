import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/** Hook genérico para operações CRUD via React Query. */
export function useCrud<T extends { id: string }, FormData = Partial<T>>(resource: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [resource] });

  const listQuery = useQuery({
    queryKey: [resource],
    queryFn: async () => (await api.get<T[]>(`/${resource}`)).data,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => (await api.post<T>(`/${resource}`, data)).data,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) =>
      (await api.put<T>(`/${resource}/${id}`, data)).data,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: invalidate,
  });

  return { listQuery, createMutation, updateMutation, deleteMutation };
}
