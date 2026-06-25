import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiErrorMessage } from '@/lib/api';
import { defaultRouteForRole } from '@/components/layout/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Informe a senha'),
  remember: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    setError(null);
    try {
      const user = await signIn(data.email, data.password);
      navigate(defaultRouteForRole(user.role));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-mint/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarDays className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-primary">CronoCita</CardTitle>
          <CardDescription>Acesse sua conta para gerenciar a clínica</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="voce@clinica.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="h-4 w-4" {...register('remember')} />
                Lembrar-me
              </label>
              <Link to="/recuperar-senha" className="font-medium text-primary hover:underline">
                Esqueci minha senha
              </Link>
            </div>

            {error && (
              <p data-cy="login-error" className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting} data-cy="login-submit">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Criar conta de paciente
            </Link>
          </div>

          <div className="mt-6 rounded-md bg-secondary p-3 text-xs text-secondary-foreground">
            <p className="font-semibold">Credenciais de demonstração (senha: 123456)</p>
            <p>super@cronocita.com (plataforma)</p>
            <p>admin@viverbem.com (admin de clínica)</p>
            <p>ana@viverbem.com (profissional)</p>
            <p>joao@cliente.com (paciente)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
