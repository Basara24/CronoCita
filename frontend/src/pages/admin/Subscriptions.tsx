import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Clinic, Subscription, SubscriptionStatus } from '@/types';

const subscriptionSchema = z.object({
  clinicId: z.string().min(1, 'Selecione a clínica'),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED']),
  price: z.coerce.number().nonnegative('Preço inválido'),
});

type SubscriptionForm = z.infer<typeof subscriptionSchema>;

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Ativa',
  PAST_DUE: 'Em atraso',
  CANCELED: 'Cancelada',
};

const STATUS_VARIANTS: Record<SubscriptionStatus, 'success' | 'warning' | 'muted'> = {
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'muted',
};

export function Subscriptions() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => (await api.get<Subscription[]>('/subscriptions')).data,
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => (await api.get<Clinic[]>('/clinics')).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] });

  const createMutation = useMutation({
    mutationFn: async (data: SubscriptionForm) => (await api.post('/subscriptions', data)).data,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<SubscriptionForm, 'clinicId'> }) =>
      (await api.put(`/subscriptions/${id}`, data)).data,
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/subscriptions/${id}`),
    onSuccess: invalidate,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscriptionForm>({ resolver: zodResolver(subscriptionSchema) });

  function openCreate() {
    setEditing(null);
    setError(null);
    reset({ clinicId: '', plan: 'BASIC', status: 'ACTIVE', price: 0 });
    setOpen(true);
  }

  function openEdit(sub: Subscription) {
    setEditing(sub);
    setError(null);
    reset({
      clinicId: sub.clinicId,
      plan: sub.plan,
      status: sub.status,
      price: Number(sub.price),
    });
    setOpen(true);
  }

  async function onSubmit(data: SubscriptionForm) {
    setError(null);
    try {
      if (editing) {
        const { clinicId: _clinicId, ...rest } = data;
        void _clinicId;
        await updateMutation.mutateAsync({ id: editing.id, data: rest });
      } else {
        await createMutation.mutateAsync(data);
      }
      setOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function onDelete(sub: Subscription) {
    if (!window.confirm('Excluir esta assinatura?')) return;
    try {
      await deleteMutation.mutateAsync(sub.id);
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assinaturas</h1>
          <p className="text-sm text-muted-foreground">Planos das clínicas na plataforma</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova assinatura
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Clínica</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.clinic?.name ?? '—'}</TableCell>
              <TableCell>{s.plan}</TableCell>
              <TableCell>{formatCurrency(s.price)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[s.status]}>{STATUS_LABELS[s.status]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(s)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {subscriptions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Nenhuma assinatura cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar assinatura' : 'Nova assinatura'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Clínica</Label>
              <Select disabled={!!editing} {...register('clinicId')}>
                <option value="">Selecione</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {errors.clinicId && <p className="text-xs text-destructive">{errors.clinicId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select {...register('plan')}>
                  <option value="BASIC">Basic</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select {...register('status')}>
                  <option value="ACTIVE">Ativa</option>
                  <option value="PAST_DUE">Em atraso</option>
                  <option value="CANCELED">Cancelada</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Valor mensal (R$)</Label>
              <Input type="number" step="0.01" min={0} {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
