import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';

export function AdminSettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground">Preferências da plataforma</p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div>
            <p className="text-sm font-medium">Conta</p>
            <p className="text-sm text-muted-foreground">{user?.name} · {user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Perfil</p>
            <p className="text-sm text-muted-foreground">Super Administrador</p>
          </div>
          <div>
            <p className="text-sm font-medium">Plataforma</p>
            <p className="text-sm text-muted-foreground">CronoCita — Marketplace de clínicas</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Mais opções de configuração (integrações de pagamento, branding e políticas) estarão
          disponíveis em versões futuras.
        </CardContent>
      </Card>
    </div>
  );
}
