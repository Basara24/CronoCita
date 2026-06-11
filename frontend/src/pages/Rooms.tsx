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
import type { ResourceStatus, Room } from '@/types';

const roomSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  capacity: z.coerce.number().int().min(1, 'Capacidade mínima é 1'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']),
});

type RoomForm = z.infer<typeof roomSchema>;

const STATUS_LABELS: Record<ResourceStatus, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  MAINTENANCE: 'Manutenção',
};

const STATUS_VARIANTS: Record<ResourceStatus, 'success' | 'muted' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'muted',
  MAINTENANCE: 'warning',
};

export function Rooms() {
  const { listQuery, createMutation, updateMutation, deleteMutation } = useCrud<Room, RoomForm>('rooms');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomForm>({ resolver: zodResolver(roomSchema) });

  function openCreate() {
    setEditing(null);
    setError(null);
    reset({ name: '', description: '', capacity: 1, status: 'ACTIVE' });
    setOpen(true);
  }

  function openEdit(room: Room) {
    setEditing(room);
    setError(null);
    reset({
      name: room.name,
      description: room.description ?? '',
      capacity: room.capacity,
      status: room.status,
    });
    setOpen(true);
  }

  async function onSubmit(data: RoomForm) {
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

  async function onDelete(room: Room) {
    if (!window.confirm(`Excluir a sala ${room.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(room.id);
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Salas</h1>
          <p className="text-sm text-muted-foreground">Recursos físicos da clínica</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nova sala
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Descrição</TableHead>
            <TableHead>Capacidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(listQuery.data ?? []).map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="hidden md:table-cell">{r.description ?? '—'}</TableCell>
              <TableCell>{r.capacity}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(r)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(listQuery.data ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Nenhuma sala cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar sala' : 'Nova sala'}</DialogTitle>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Capacidade</Label>
                <Input type="number" min={1} {...register('capacity')} />
                {errors.capacity && (
                  <p className="text-xs text-destructive">{errors.capacity.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select {...register('status')}>
                  <option value="ACTIVE">Ativa</option>
                  <option value="INACTIVE">Inativa</option>
                  <option value="MAINTENANCE">Manutenção</option>
                </Select>
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
