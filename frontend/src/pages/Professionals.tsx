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
import type { Professional } from '@/types';

const professionalSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  specialty: z.string().min(2, 'Informe a especialidade'),
  commissionPercentage: z.coerce.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
});

type ProfessionalForm = z.infer<typeof professionalSchema>;

export function Professionals() {
  const { listQuery, createMutation, updateMutation, deleteMutation } = useCrud<
    Professional,
    ProfessionalForm
  >('professionals');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfessionalForm>({ resolver: zodResolver(professionalSchema) });

  function openCreate() {
    setEditing(null);
    setError(null);
    reset({ name: '', specialty: '', commissionPercentage: 70, phone: '', email: '' });
    setOpen(true);
  }

  function openEdit(professional: Professional) {
    setEditing(professional);
    setError(null);
    reset({
      name: professional.name,
      specialty: professional.specialty,
      commissionPercentage: Number(professional.commissionPercentage),
      phone: professional.phone,
      email: professional.email,
    });
    setOpen(true);
  }

  async function onSubmit(data: ProfessionalForm) {
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

  async function onDelete(professional: Professional) {
    if (!window.confirm(`Excluir o profissional ${professional.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(professional.id);
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Profissionais</h1>
          <p className="text-sm text-muted-foreground">
            Equipe da clínica e percentuais de comissão
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo profissional
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Especialidade</TableHead>
            <TableHead>Comissão</TableHead>
            <TableHead className="hidden md:table-cell">E-mail</TableHead>
            <TableHead className="hidden md:table-cell">Telefone</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(listQuery.data ?? []).map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>
                <Badge variant="mint">{p.specialty}</Badge>
              </TableCell>
              <TableCell>{Number(p.commissionPercentage).toFixed(0)}%</TableCell>
              <TableCell className="hidden md:table-cell">{p.email}</TableCell>
              <TableCell className="hidden md:table-cell">{p.phone}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(p)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(listQuery.data ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhum profissional cadastrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar profissional' : 'Novo profissional'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Especialidade</Label>
                <Input placeholder="Fisioterapia, Nutrição..." {...register('specialty')} />
                {errors.specialty && (
                  <p className="text-xs text-destructive">{errors.specialty.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Comissão (%)</Label>
                <Input type="number" min={0} max={100} {...register('commissionPercentage')} />
                {errors.commissionPercentage && (
                  <p className="text-xs text-destructive">{errors.commissionPercentage.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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
