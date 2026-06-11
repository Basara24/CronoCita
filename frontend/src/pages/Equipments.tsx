import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { useCrud } from '@/hooks/useCrud';
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
import type { Equipment, ResourceStatus } from '@/types';

const equipmentSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
});

type EquipmentForm = z.infer<typeof equipmentSchema>;

const STATUS_LABELS: Record<ResourceStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  MAINTENANCE: 'Manutenção',
};

const STATUS_VARIANTS: Record<ResourceStatus, 'success' | 'muted' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
  MAINTENANCE: 'warning',
};

export function Equipments() {
  const { listQuery, createMutation, updateMutation, deleteMutation } = useCrud<
    Equipment,
    EquipmentForm
  >('equipments');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EquipmentForm>({ resolver: zodResolver(equipmentSchema) });

  function openCreate() {
    setEditing(null);
    setError(null);
    reset({ name: '', description: '', status: 'ACTIVE' });
    setOpen(true);
  }

  function openEdit(equipment: Equipment) {
    setEditing(equipment);
    setError(null);
    reset({
      name: equipment.name,
      description: equipment.description ?? '',
      status: equipment.status,
    });
    setOpen(true);
  }

  async function onSubmit(data: EquipmentForm) {
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

  async function onDelete(equipment: Equipment) {
    if (!window.confirm(`Excluir o equipamento ${equipment.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(equipment.id);
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Equipamentos</h1>
          <p className="text-sm text-muted-foreground">Equipamentos disponíveis para os serviços</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo equipamento
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(listQuery.data ?? []).map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium">{e.name}</TableCell>
              <TableCell className="hidden md:table-cell">{e.description ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[e.status]}>{STATUS_LABELS[e.status]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(e)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(listQuery.data ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                Nenhum equipamento cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar equipamento' : 'Novo equipamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select {...register('status')}>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="MAINTENANCE">Manutenção</option>
              </Select>
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
