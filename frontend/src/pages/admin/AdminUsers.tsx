import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
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
import type { Clinic, Role, User } from '@/types';

const userSchema = z.object({
  name: z.string().min(3, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  role: z.enum(['CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL']),
});

type UserForm = z.infer<typeof userSchema>;

const ROLE_LABELS: Partial<Record<Role, string>> = {
  CLINIC_ADMIN: 'Administrador',
  SECRETARY: 'Secretária',
  PROFESSIONAL: 'Profissional',
  PATIENT: 'Paciente',
};

export function AdminUsers() {
  const queryClient = useQueryClient();
  const [clinicId, setClinicId] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: clinics = [] } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => (await api.get<Clinic[]>('/clinics')).data,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'users', clinicId],
    queryFn: async () => (await api.get<User[]>('/users', { params: { clinicId } })).data,
    enabled: !!clinicId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserForm) =>
      (await api.post('/users', data, { params: { clinicId } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users', clinicId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`, { params: { clinicId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users', clinicId] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({ resolver: zodResolver(userSchema) });

  function openCreate() {
    setError(null);
    reset({ name: '', email: '', password: '', role: 'CLINIC_ADMIN' });
    setOpen(true);
  }

  async function onSubmit(data: UserForm) {
    setError(null);
    try {
      await createMutation.mutateAsync(data);
      setOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function onDelete(user: User) {
    if (!window.confirm(`Remover o usuário ${user.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(user.id);
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários de cada clínica</p>
        </div>
        <Button onClick={openCreate} disabled={!clinicId}>
          <Plus className="h-4 w-4" /> Novo usuário
        </Button>
      </div>

      <div className="max-w-sm space-y-1.5">
        <Label>Clínica</Label>
        <Select value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
          <option value="">Selecione uma clínica</option>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      {clinicId && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(u)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Nenhum usuário nesta clínica.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Senha</Label>
              <Input type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Perfil</Label>
              <Select {...register('role')}>
                <option value="CLINIC_ADMIN">Administrador</option>
                <option value="SECRETARY">Secretária</option>
                <option value="PROFESSIONAL">Profissional</option>
              </Select>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
