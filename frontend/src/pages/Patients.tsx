import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { applyMask } from '@/lib/masks';
import { formatDate } from '@/lib/utils';
import {
  digitsOnly,
  isoToBrDate,
  parseBrDateToISO,
  zBrDate,
  zCep,
  zCpf,
  zNonEmptyString,
  zPhone,
} from '@/lib/validators/zodBr';
import { useCrud } from '@/hooks/useCrud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Label } from '@/components/ui/label';
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
import type { Patient } from '@/types';

const patientSchema = z.object({
  name: zNonEmptyString('Nome é obrigatório').min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf: zCpf(),
  email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  phone: zPhone(),
  birthDate: zBrDate('Informe a data de nascimento'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional().refine((v) => !v || zCep().safeParse(v).success, 'CEP inválido'),
});

type PatientForm = z.infer<typeof patientSchema>;

function toApiPayload(data: PatientForm): PatientForm {
  return {
    ...data,
    cpf: digitsOnly(data.cpf),
    phone: digitsOnly(data.phone),
    birthDate: parseBrDateToISO(data.birthDate),
    zipCode: data.zipCode ? digitsOnly(data.zipCode) : undefined,
  };
}

export function Patients() {
  const { listQuery, createMutation, updateMutation, deleteMutation } = useCrud<Patient, PatientForm>('patients');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatientForm>({ resolver: zodResolver(patientSchema) });

  function openCreate() {
    setEditing(null);
    setError(null);
    reset({ name: '', cpf: '', email: '', phone: '', birthDate: '', address: '', city: '', state: '', zipCode: '' });
    setOpen(true);
  }

  function openEdit(patient: Patient) {
    setEditing(patient);
    setError(null);
    reset({
      name: patient.name,
      cpf: applyMask('cpf', patient.cpf),
      email: patient.email,
      phone: applyMask('phone', patient.phone),
      birthDate: isoToBrDate(patient.birthDate),
      address: patient.address ?? '',
      city: patient.city ?? '',
      state: patient.state ?? '',
      zipCode: patient.zipCode ? applyMask('cep', patient.zipCode) : '',
    });
    setOpen(true);
  }

  async function onSubmit(data: PatientForm) {
    setError(null);
    const payload = toApiPayload(data);
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

  async function onDelete(patient: Patient) {
    if (!window.confirm(`Excluir o paciente ${patient.name}?`)) return;
    try {
      await deleteMutation.mutateAsync(patient.id);
    } catch (err) {
      window.alert(apiErrorMessage(err));
    }
  }

  const patients = (listQuery.data ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.cpf.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase()),
  );

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro e gestão de pacientes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Novo paciente
        </Button>
      </div>

      <Input
        placeholder="Buscar por nome, CPF ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead className="hidden md:table-cell">E-mail</TableHead>
            <TableHead className="hidden md:table-cell">Telefone</TableHead>
            <TableHead className="hidden lg:table-cell">Nascimento</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{applyMask('cpf', p.cpf)}</TableCell>
              <TableCell className="hidden md:table-cell">{p.email}</TableCell>
              <TableCell className="hidden md:table-cell">{applyMask('phone', p.phone)}</TableCell>
              <TableCell className="hidden lg:table-cell">{formatDate(p.birthDate)}</TableCell>
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
          {patients.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Nenhum paciente encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar paciente' : 'Novo paciente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <MaskedInput mask="cpf" placeholder="000.000.000-00" {...register('cpf')} />
                {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nascimento</Label>
                <MaskedInput mask="date" placeholder="DD/MM/AAAA" {...register('birthDate')} />
                {errors.birthDate && (
                  <p className="text-xs text-destructive">{errors.birthDate.message}</p>
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
                <MaskedInput mask="phone" placeholder="(11) 99999-9999" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input {...register('address')} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input {...register('city')} />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input maxLength={2} {...register('state')} />
              </div>
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <MaskedInput mask="cep" placeholder="00000-000" {...register('zipCode')} />
                {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode.message}</p>}
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
