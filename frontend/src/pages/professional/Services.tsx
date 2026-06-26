import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, apiErrorMessage, resolveAssetUrl } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import type { ProfessionalService, ResourceStatus } from '@/types';

interface FormState {
  id?: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  imageUrl: string;
  status: ResourceStatus;
}

const EMPTY: FormState = {
  name: '',
  description: '',
  durationMinutes: 30,
  price: 0,
  imageUrl: '',
  status: 'ACTIVE',
};

export function ProfessionalServicesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['professional', 'services'],
    queryFn: async () => (await api.get<ProfessionalService[]>('/professional/services')).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['professional', 'services'] });
  }

  const saveMut = useMutation({
    mutationFn: async (data: FormState) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        durationMinutes: Number(data.durationMinutes),
        price: Number(data.price),
        imageUrl: data.imageUrl || undefined,
        status: data.status,
      };
      if (data.id) return api.put(`/professional/services/${data.id}`, payload);
      return api.post('/professional/services', payload);
    },
    onSuccess: () => {
      toast.success('Serviço salvo');
      setForm(null);
      invalidate();
    },
    onError: (e) => toast.error('Erro ao salvar', apiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/professional/services/${id}`),
    onSuccess: () => {
      toast.success('Serviço removido');
      invalidate();
    },
    onError: (e) => toast.error('Erro ao remover', apiErrorMessage(e)),
  });

  async function handleUpload(file: File) {
    const data = new FormData();
    data.append('image', file);
    setUploading(true);
    try {
      const { data: res } = await api.post<{ url: string }>('/professional/services/upload', data);
      setForm((f) => (f ? { ...f, imageUrl: res.url } : f));
    } catch (e) {
      toast.error('Falha no upload', apiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços que você oferece.</p>
        </div>
        <Button onClick={() => setForm({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      </div>

      {form && (
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ResourceStatus })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="MAINTENANCE">Em manutenção</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Duração (min)</label>
              <Input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Preço (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Imagem</label>
              <div className="flex items-center gap-3">
                {form.imageUrl && (
                  <img src={resolveAssetUrl(form.imageUrl)} alt="" className="h-12 w-12 rounded object-cover" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  className="text-sm"
                />
                {uploading && <span className="text-xs text-muted-foreground">Enviando...</span>}
              </div>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button disabled={!form.name || saveMut.isPending} onClick={() => saveMut.mutate(form)}>
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setForm(null)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : services.length === 0 ? (
        <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id}>
              <CardContent className="space-y-2 p-4">
                {s.imageUrl && (
                  <img src={resolveAssetUrl(s.imageUrl)} alt={s.name} className="h-28 w-full rounded-lg object-cover" />
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.durationMinutes} min · {formatCurrency(s.price)}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">{s.status}</span>
                </div>
                {s.description && <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm({
                        id: s.id,
                        name: s.name,
                        description: s.description ?? '',
                        durationMinutes: s.durationMinutes,
                        price: Number(s.price),
                        imageUrl: s.imageUrl ?? '',
                        status: s.status,
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMut.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
