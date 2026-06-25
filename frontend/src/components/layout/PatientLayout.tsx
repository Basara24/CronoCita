import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, CalendarDays, Home, LogOut, Menu, MessageSquare, Stethoscope, User, X } from 'lucide-react';
import { api, resolveAssetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { PatientDashboard } from '@/types';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/minha-conta', label: 'Início', icon: CalendarDays, end: true },
  { to: '/meus-agendamentos', label: 'Meus Agendamentos', icon: CalendarDays },
  { to: '/mensagens', label: 'Mensagens', icon: MessageSquare },
  { to: '/notificacoes', label: 'Notificações', icon: Bell },
  { to: '/perfil', label: 'Meu Perfil', icon: User },
];

export function PatientLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: dashboard } = useQuery({
    queryKey: ['me', 'dashboard', 'badge'],
    queryFn: async () => (await api.get<PatientDashboard>('/me/dashboard')).data,
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const unread = dashboard?.unreadNotifications ?? 0;

  if (!user) return null;

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  const links = (
    <>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
            )
          }
        >
          <span className="relative">
            <item.icon className="h-4 w-4" />
            {item.to === '/notificacoes' && unread > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread}
              </span>
            )}
          </span>
          {item.label}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/minha-conta" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-primary">CronoCita</p>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">{links}</nav>

          <div className="hidden items-center gap-3 lg:flex">
            {user.avatarUrl ? (
              <img src={resolveAssetUrl(user.avatarUrl)} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {user.name.charAt(0)}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {menuOpen && (
          <nav className="space-y-1 border-t p-3 lg:hidden">
            {links}
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </nav>
        )}
      </header>

      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
