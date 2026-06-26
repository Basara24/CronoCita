import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, Loader2, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { applyMask } from '@/lib/masks';
import { digitsOnly, zCep, zCnpj, zNonEmptyString, zPhone } from '@/lib/validators/zodBr';
import { useCrud } from '@/hooks/useCrud';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
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
import { SPECIALTY_OPTIONS, type Clinic } from '@/types';

const clinicSchema = z.object({
  name: zNonEmptyString('Nome obrigatório').min(2, 'Nome obrigatório'),
  cnpj: zCnpj(),
  email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  phone: zPhone(),
  description: z.string().optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  address: zNonEmptyString('Endereço obrigatório').min(3, 'Endereço obrigatório'),
  city: zNonEmptyString('Cidade obrigatória').min(2, 'Cidade obrigatória'),
  state: zNonEmptyString('UF obrigatória').min(2, 'UF obrigatória'),
  zipCode: zCep(),
  adminName: z.string().optional(),
  adminEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  adminPassword: z.string().optional(),
});

type ClinicForm = z.infer<typeof clinicSchema>;

interface ClinicPayload {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  description?: string;
  logoUrl?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  specialties: string[];
  admin?: { name: string; email: string; password: string };
}

export function Clinics() {
  const queryClient = useQueryClient();
  const { listQuery, createMutation, updateMutation, deleteMutation } = useCrud<Clinic, ClinicPayload>('clinics');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Clinic | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      (await api.patch(`/clinics/${id}/status`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clinics'] }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClinicForm>({ resolver: zodResolver(clinicSchema) });

  function openCreate() {
    setEditing(null);
    setError(null);
    setSpecialties([]);
    reset({
      name: '',
      cnpj: '',
      email: '',
      phone: '',
      description: '',
      logoUrl: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    });
    setOpen(true);
  }

  function openEdit(clinic: Clinic) {
    setEditing(clinic);
    setError(null);
    setSpecialties(clinic.specialties.map((s) => s.specialty));
    reset({
      name: clinic.name,
      cnpj: applyMask('cnpj', clinic.cnpj),
      email: clinic.email,
      phone: applyMask('phone', clinic.phone),
      description: clinic.description ?? '',
      logoUrl: clinic.logoUrl ?? '',
      address: clinic.address,
      city: clinic.city,
      state: clinic.state,
      zipCode: applyMask('cep', clinic.zipCode),
    });
    setOpen(true);
  }

  function toggleSpecialty(specialty: string) {
    setSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty],
    );
  }

  async function onSubmit(data: ClinicForm) {
    setError(null);
    const payload: ClinicPayload = {
      name: data.name,
      cnpj: digitsOnly(data.cnpj),
      email: data.email,
      phone: digitsOnly(data.phone),
      description: data.description || undefined,
      logoUrl: data.logoUrl || undefined,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: digitsOnly(data.zipCode),
      specialties,
    };

    if (!editing && data.adminName && data.adminEmail && data.adminPassword) {
      payload.admin = {
        name: data.adminName,
        email: data.adminEmail,
        password: data.adminPassword,
      };
    }

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function onDelete(clinic: Clinic) {
    if (!window.confirm(`Excluir a clínica ${clinic.name}? Esta ação remove todos os dados.`)) return;
    try {
      await deleteMutation.mutateAsync(clinic.id);
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clínicas</h1>
          <p className="text-sm text-muted-foreground">Gestão das clínicas da plataforma</p>
        </div>
        <Button onClick={openCreate} data-cy="new-clinic">
          <Plus className="h-4 w-4" /> Nova clínica
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Cidade</TableHead>
            <TableHead className="hidden lg:table-cell">Especialidades</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-36" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(listQuery.data ?? []).map((c) => (
            <TableRow key={c.id} data-cy="clinic-row">
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="hidden md:table-cell">
                {c.city} - {c.state}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {c.specialties.map((s) => (
                    <Badge key={s.specialty}>{s.specialty}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={c.status === 'ACTIVE' ? 'success' : 'muted'}>
                  {c.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Link
                    to={`/clinica/${c.slug}`}
                    target="_blank"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
                    title="Ver página pública"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={c.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
                    onClick={() =>
                      statusMutation.mutate({
                        id: c.id,
                        status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                      })
                    }
                  >
                    <Power className={c.status === 'ACTIVE' ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4 text-muted-foreground'} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(c)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(listQuery.data ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                Nenhuma clínica cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar clínica' : 'Nova clínica'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input data-cy="clinic-name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <MaskedInput mask="cnpj" data-cy="clinic-cnpj" placeholder="00.000.000/0000-00" {...register('cnpj')} />
                {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <MaskedInput mask="phone" placeholder="(11) 99999-9999" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input {...register('address')} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input {...register('city')} />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input maxLength={2} {...register('state')} />
                {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <MaskedInput mask="cep" placeholder="00000-000" {...register('zipCode')} />
                {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Logo (URL)</Label>
              <Input {...register('logoUrl')} />
              {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input {...register('description')} />
            </div>

            <div className="space-y-1.5">
              <Label>Especialidades</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SPECIALTY_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      data-cy="specialty-checkbox"
                      checked={specialties.includes(s)}
                      onChange={() => toggleSpecialty(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            {!editing && (
              <div className="rounded-md border border-dashed p-3">
                <p className="mb-2 text-sm font-medium">Administrador inicial (opcional)</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Nome</Label>
                    <Input {...register('adminName')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-mail</Label>
                    <Input type="email" {...register('adminEmail')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Senha</Label>
                    <Input type="password" {...register('adminPassword')} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p data-cy="clinic-error" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} data-cy="save-clinic">
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
