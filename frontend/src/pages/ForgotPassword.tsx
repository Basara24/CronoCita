import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Loader2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestReset() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', { email });
      setMessage(data.message);
      // Em ambiente de demonstração o token é retornado para facilitar o teste
      if (data.resetToken) setResetToken(data.resetToken);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, password: newPassword });
      setMessage('Senha alterada com sucesso! Você já pode entrar.');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-mint/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-primary">Recuperar senha</CardTitle>
          <CardDescription>Enviaremos um link de recuperação para o seu e-mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button className="w-full" onClick={requestReset} disabled={loading || !email}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar link de recuperação
          </Button>

          {resetToken && (
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-xs text-muted-foreground">
                Token de recuperação (demonstração): use-o para definir uma nova senha.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="token">Token</Label>
                <Input id="token" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={confirmReset} disabled={loading || newPassword.length < 8}>
                Definir nova senha
              </Button>
            </div>
          )}

          {message && <p className="rounded-md bg-mint/20 p-2 text-sm text-mint-foreground">{message}</p>}
          {error && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

          <div className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
