import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage, resolveAssetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import type { ProfessionalProfile } from '@/types';

export function ProfessionalProfilePage() {
  const toast = useToast();
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', specialty: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['professional', 'profile'],
    queryFn: async () => (await api.get<ProfessionalProfile>('/professional/profile')).data,
  });

  useEffect(() => {
    if (data) setForm({ name: data.name, phone: data.phone, specialty: data.specialty });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => (await api.put<ProfessionalProfile>('/professional/profile', form)).data,
    onSuccess: (updated) => {
      toast.success('Perfil atualizado');
      updateUser({ name: updated.name });
      queryClient.invalidateQueries({ queryKey: ['professional', 'profile'] });
    },
    onError: (e) => toast.error('Erro ao salvar', apiErrorMessage(e)),
  });

  const avatarMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return (await api.post<{ avatarUrl: string }>('/me/avatar', fd)).data;
    },
    onError: (e) => toast.error('Falha no upload', apiErrorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-64 w-full max-w-lg" />;

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Atualize seus dados profissionais.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            {data?.avatarUrl ? (
              <img src={resolveAssetUrl(data.avatarUrl)} alt={data.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {data?.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">Foto de perfil</p>
              <input
                type="file"
                accept="image/*"
                className="mt-1 text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    avatarMut.mutate(file, {
                      onSuccess: (res) => {
                        updateUser({ avatarUrl: res.avatarUrl });
                        queryClient.invalidateQueries({ queryKey: ['professional', 'profile'] });
                        toast.success('Foto atualizada');
                      },
                    });
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Nome</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Especialidade</label>
            <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Telefone</label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">E-mail</label>
            <Input value={data?.email ?? ''} disabled />
          </div>

          <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
            Salvar alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
