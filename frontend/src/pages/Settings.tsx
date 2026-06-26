import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, MapPin, Trash2 } from 'lucide-react';
import { api, apiErrorMessage, resolveAssetUrl } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import type { ClinicPhotoCategory, ClinicSelf } from '@/types';

type Tab = 'identity' | 'photos' | 'location';

const TABS: { id: Tab; label: string }[] = [
  { id: 'identity', label: 'Identidade Visual' },
  { id: 'photos', label: 'Fotos da Clínica' },
  { id: 'location', label: 'Localização' },
];

const CATEGORIES: { value: ClinicPhotoCategory; label: string }[] = [
  { value: 'RECEPTION', label: 'Recepção' },
  { value: 'CONSULTORIO', label: 'Consultório' },
  { value: 'EQUIPMENT', label: 'Equipamentos' },
  { value: 'TEAM', label: 'Equipe' },
  { value: 'FACADE', label: 'Fachada' },
  { value: 'OTHER', label: 'Outros' },
];

export function ClinicSettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('identity');

  const { data, isLoading } = useQuery({
    queryKey: ['clinics', 'me'],
    queryFn: async () => (await api.get<ClinicSelf>('/clinics/me')).data,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Configurações da Clínica</h1>
        <p className="text-muted-foreground">Personalize a identidade visual, fotos e localização.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'identity' && <IdentityTab clinic={data} onSaved={() => queryClient.invalidateQueries({ queryKey: ['clinics', 'me'] })} toast={toast} />}
      {tab === 'photos' && <PhotosTab clinic={data} onChanged={() => queryClient.invalidateQueries({ queryKey: ['clinics', 'me'] })} toast={toast} />}
      {tab === 'location' && <LocationTab clinic={data} onSaved={() => queryClient.invalidateQueries({ queryKey: ['clinics', 'me'] })} toast={toast} />}
    </div>
  );
}

type ToastApi = ReturnType<typeof useToast>;

function IdentityTab({ clinic, onSaved, toast }: { clinic: ClinicSelf; onSaved: () => void; toast: ToastApi }) {
  const [form, setForm] = useState({
    name: clinic.name,
    description: clinic.description ?? '',
    phone: clinic.phone,
    email: clinic.email,
    logoUrl: clinic.logoUrl ?? '',
    coverImageUrl: clinic.coverImageUrl ?? '',
    website: clinic.website ?? '',
    instagram: clinic.instagram ?? '',
    facebook: clinic.facebook ?? '',
  });

  const saveMut = useMutation({
    mutationFn: async () => api.put('/clinics/me', form),
    onSuccess: () => {
      toast.success('Identidade visual atualizada');
      onSaved();
    },
    onError: (e) => toast.error('Erro ao salvar', apiErrorMessage(e)),
  });

  async function upload(file: File, field: 'logoUrl' | 'coverImageUrl') {
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await api.post<{ url: string }>('/clinics/me/upload', fd);
      setForm((f) => ({ ...f, [field]: data.url }));
      toast.success('Imagem enviada');
    } catch (e) {
      toast.error('Falha no upload', apiErrorMessage(e));
    }
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Logo</label>
            <div className="mt-1 flex items-center gap-3">
              {form.logoUrl && <img src={resolveAssetUrl(form.logoUrl)} alt="logo" className="h-14 w-14 rounded-lg object-cover" />}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'logoUrl')} className="text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Imagem de capa</label>
            <div className="mt-1 flex items-center gap-3">
              {form.coverImageUrl && <img src={resolveAssetUrl(form.coverImageUrl)} alt="capa" className="h-14 w-24 rounded-lg object-cover" />}
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], 'coverImageUrl')} className="text-sm" />
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground">Nome</label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Telefone</label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">E-mail</label>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Site</label>
          <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Instagram</label>
          <Input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/..." />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Facebook</label>
          <Input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://facebook.com/..." />
        </div>

        <div className="sm:col-span-2">
          <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
            Salvar identidade visual
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PhotosTab({ clinic, onChanged, toast }: { clinic: ClinicSelf; onChanged: () => void; toast: ToastApi }) {
  const [category, setCategory] = useState<ClinicPhotoCategory>('RECEPTION');

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('category', category);
      return api.post('/clinics/me/photos/upload', fd);
    },
    onSuccess: () => {
      toast.success('Foto adicionada');
      onChanged();
    },
    onError: (e) => toast.error('Falha no upload', apiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => api.delete(`/clinics/me/photos/${id}`),
    onSuccess: () => {
      toast.success('Foto removida');
      onChanged();
    },
    onError: (e) => toast.error('Erro ao remover', apiErrorMessage(e)),
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ClinicPhotoCategory)}
              className="flex h-9 w-44 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <label className={cn('inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-4 py-2 text-sm shadow-sm hover:bg-accent')}>
            <ImagePlus className="h-4 w-4" /> Adicionar foto
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadMut.mutate(e.target.files[0])} />
          </label>
        </div>

        {clinic.photos.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma foto adicionada.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {clinic.photos.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-lg border">
                <img src={resolveAssetUrl(p.url)} alt={p.caption ?? ''} className="h-32 w-full object-cover" />
                <span className="absolute left-1 top-1 rounded bg-card/90 px-1.5 py-0.5 text-[10px]">
                  {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}
                </span>
                <button
                  onClick={() => deleteMut.mutate(p.id)}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LocationTab({ clinic, onSaved, toast }: { clinic: ClinicSelf; onSaved: () => void; toast: ToastApi }) {
  const [form, setForm] = useState({
    zipCode: clinic.zipCode,
    address: clinic.address,
    city: clinic.city,
    state: clinic.state,
    latitude: clinic.latitude != null ? String(clinic.latitude) : '',
    longitude: clinic.longitude != null ? String(clinic.longitude) : '',
  });

  const saveMut = useMutation({
    mutationFn: async () =>
      api.put('/clinics/me', {
        zipCode: form.zipCode,
        address: form.address,
        city: form.city,
        state: form.state,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      }),
    onSuccess: () => {
      toast.success('Localização atualizada');
      onSaved();
    },
    onError: (e) => toast.error('Erro ao salvar', apiErrorMessage(e)),
  });

  const mapsQuery = encodeURIComponent(`${form.address}, ${form.city} - ${form.state}`);

  return (
    <Card>
      <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">CEP</label>
          <Input value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Endereço (rua e número)</label>
          <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Cidade</label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Estado</label>
          <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Latitude (opcional)</label>
          <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Longitude (opcional)</label>
          <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" /> Pré-visualização do mapa
          </p>
          <iframe
            title="Mapa"
            className="h-60 w-full rounded-lg border"
            loading="lazy"
            src={`https://maps.google.com/maps?q=${mapsQuery}&output=embed`}
          />
        </div>

        <div className="sm:col-span-2">
          <Button disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
            Salvar localização
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
