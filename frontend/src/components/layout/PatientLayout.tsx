import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { api, resolveAssetUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { PatientDashboard } from '@/types';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/minha-conta', label: 'Início', icon: CalendarDays, end: true },
  { to: '/clinicas', label: 'Clínicas', icon: Stethoscope },
  { to: '/meus-agendamentos', label: 'Meus Agendamentos', icon: CalendarDays },
  { to: '/mensagens', label: 'Mensagens', icon: MessageSquare },
];

const DROPDOWN = [
  { to: '/perfil', label: 'Meu Perfil', icon: User },
  { to: '/favoritos', label: 'Clínicas Favoritas', icon: Heart },
  { to: '/historico', label: 'Histórico de Serviços', icon: ClipboardList },
  { to: '/meus-agendamentos', label: 'Meus Agendamentos', icon: CalendarDays },
  { to: '/notificacoes', label: 'Notificações', icon: Bell },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function PatientLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: dashboard } = useQuery({
    queryKey: ['me', 'dashboard', 'badge'],
    queryFn: async () => (await api.get<PatientDashboard>('/me/dashboard')).data,
    enabled: !!user,
    refetchInterval: 30_000,
  });

  const unread = dashboard?.unreadNotifications ?? 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  const avatar = user.avatarUrl ? (
    <img src={resolveAssetUrl(user.avatarUrl)} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
      {user.name.charAt(0).toUpperCase()}
    </div>
  );

  const links = (
    <>
      {NAV.map((item) => (
        <NavLink
          key={item.to + item.label}
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
          <item.icon className="h-4 w-4" />
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

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <NavLink to="/notificacoes" className="relative" aria-label="Notificações">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </NavLink>

            <div className="relative hidden lg:block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-secondary"
              >
                {avatar}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border bg-card shadow-lg">
                  <div className="border-b px-4 py-3">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {DROPDOWN.map((item) => (
                    <NavLink
                      key={item.to + item.label}
                      to={item.to}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </NavLink>
                  ))}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 border-t px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> Sair
                  </button>
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <nav className="space-y-1 border-t p-3 lg:hidden">
            {links}
            <div className="my-2 border-t" />
            {DROPDOWN.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
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
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
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
