import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useCrud } from '@/hooks/useCrud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Equipment, Service } from '@/types';

const serviceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  durationMinutes: z.coerce.number().int().min(5, 'Duração mínima é 5 minutos'),
  price: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  requiresRoom: z.boolean(),
  equipmentIds: z.array(z.string()).optional(),
});

type ServiceForm = z.infer<typeof serviceSchema>;

export function Services() {
  const { listQuery, createMutation, updateMutation, deleteMutation } = useCrud<
    Service,
    ServiceForm
  >('services');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: equipments = [] } = useQuery({
    queryKey: ['equipments'],
    queryFn: async () => (await api.get<Equipment[]>('/equipments')).data,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceForm>({ resolver: zodResolver(serviceSchema) });

  function openCreate() {
    setEditing(null);
    setError(null);
    reset({ name: '', durationMinutes: 60, price: 0, requiresRoom: true, equipmentIds: [] });
    setOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setError(null);
    reset({
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      requiresRoom: service.requiresRoom,
      equipmentIds: service.equipments.map((e) => e.equipment.id),
    });
    setOpen(true);
  }

  async function onSubmit(data: ServiceForm) {
    setError(null);
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function onDelete(service: Service) {
    if (!window.confirm(`Excluir o serviço ${service.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(service.id);
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de serviços, duração, valores e recursos necessários
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo serviço
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="hidden md:table-cell">Sala obrigatória</TableHead>
            <TableHead className="hidden lg:table-cell">Equipamentos</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(listQuery.data ?? []).map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell>{s.durationMinutes} min</TableCell>
              <TableCell>{formatCurrency(s.price)}</TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={s.requiresRoom ? 'default' : 'muted'}>
                  {s.requiresRoom ? 'Sim' : 'Não'}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {s.equipments.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {s.equipments.map((e) => (
                      <Badge key={e.equipment.id} variant="mint">
                        {e.equipment.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  '—'
                )}
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
          {(listQuery.data ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhum serviço cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input placeholder="Fisioterapia, Nutrição, Estética..." {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duração (minutos)</Label>
                <Input type="number" min={5} step={5} {...register('durationMinutes')} />
                {errors.durationMinutes && (
                  <p className="text-xs text-destructive">{errors.durationMinutes.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input type="number" min={0} step="0.01" {...register('price')} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="requiresRoom" type="checkbox" className="h-4 w-4" {...register('requiresRoom')} />
              <Label htmlFor="requiresRoom">Exige sala</Label>
            </div>
            <div className="space-y-1.5">
              <Label>Equipamentos necessários</Label>
              <div className="space-y-1 rounded-md border p-3">
                {equipments.map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" value={e.id} className="h-4 w-4" {...register('equipmentIds')} />
                    {e.name}
                  </label>
                ))}
                {equipments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum equipamento cadastrado.</p>
                )}
              </div>
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
