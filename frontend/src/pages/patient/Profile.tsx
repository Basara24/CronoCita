import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, Loader2 } from 'lucide-react';
import { api, apiErrorMessage, resolveAssetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Label } from '@/components/ui/label';
import { applyMask } from '@/lib/masks';
import { digitsOnly } from '@/lib/validators/zodBr';
import { Card, CardContent } from '@/components/ui/card';
import type { PatientProfile } from '@/types';
import { PatientAppointmentsPage } from './Appointments';
import { PatientHistoryPage } from './History';
import { PatientNotificationsPage } from './Notifications';

const TABS = [
  { id: 'data', label: 'Dados Pessoais' },
  { id: 'appointments', label: 'Agendamentos' },
  { id: 'history', label: 'Histórico' },
  { id: 'notifications', label: 'Notificações' },
  { id: 'settings', label: 'Configurações' },
] as const;

type Tab = (typeof TABS)[number]['id'];

export function PatientProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>('data');

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center">
          <AvatarUploader />
          <div className="text-center sm:text-left">
            <p className="text-xl font-bold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.phone ?? 'Sem telefone'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.id} variant={tab === t.id ? 'default' : 'outline'} size="sm" onClick={() => setTab(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'data' && <PersonalDataForm onSaved={(p) => updateUser({ name: p.name, phone: p.phone })} />}
      {tab === 'appointments' && <PatientAppointmentsPage />}
      {tab === 'history' && <PatientHistoryPage />}
      {tab === 'notifications' && <PatientNotificationsPage />}
      {tab === 'settings' && <PasswordForm />}
    </div>
  );
}

function AvatarUploader() {
  const { user, updateUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const { data } = await api.post<{ avatarUrl: string }>('/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatarUrl: data.avatarUrl });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative">
      {user?.avatarUrl ? (
        <img src={resolveAssetUrl(user.avatarUrl)} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {user?.name?.charAt(0)}
        </div>
      )}
      <button
        type="button"
        data-cy="avatar-upload"
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}

function PersonalDataForm({ onSaved }: { onSaved: (p: { name: string; phone: string }) => void }) {
  const { data } = useQuery({
    queryKey: ['me', 'profile'],
    queryFn: async () => (await api.get<PatientProfile>('/me/profile')).data,
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setPhone(data.phone ? applyMask('phone', data.phone) : '');
      setAddress(data.address ?? '');
    }
  }, [data]);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.put('/me/profile', { name, phone: digitsOnly(phone), address });
      onSaved({ name, phone });
      setMessage('Dados atualizados com sucesso.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="max-w-lg space-y-4 p-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>CPF</Label>
          <Input value={data?.cpf ?? ''} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <MaskedInput id="phone" mask="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        {message && <p className="text-sm text-mint-foreground">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={save} disabled={saving} data-cy="save-profile">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.put('/me/password', { currentPassword, newPassword });
      setMessage('Senha alterada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className={cn('max-w-lg space-y-4 p-6')}>
        <div className="space-y-1.5">
          <Label htmlFor="current">Senha atual</Label>
          <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new">Nova senha</Label>
          <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        {message && <p className="text-sm text-mint-foreground">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={save} disabled={saving || newPassword.length < 8}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Alterar senha
        </Button>
      </CardContent>
    </Card>
  );
}
