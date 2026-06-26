import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Box,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Stethoscope,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ClinicLogo } from '@/components/ClinicLogo';
import type { ClinicSelf, Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/painel', label: 'Dashboard', icon: LayoutDashboard, roles: ['CLINIC_ADMIN'] },
  { to: '/painel/agenda', label: 'Agenda', icon: CalendarDays, roles: ['CLINIC_ADMIN', 'SECRETARY'] },
  { to: '/painel/pacientes', label: 'Pacientes', icon: Users, roles: ['CLINIC_ADMIN', 'SECRETARY'] },
  { to: '/painel/profissionais', label: 'Profissionais', icon: Stethoscope, roles: ['CLINIC_ADMIN'] },
  { to: '/painel/salas', label: 'Salas', icon: DoorOpen, roles: ['CLINIC_ADMIN'] },
  { to: '/painel/equipamentos', label: 'Equipamentos', icon: Box, roles: ['CLINIC_ADMIN'] },
  { to: '/painel/servicos', label: 'Serviços', icon: ClipboardList, roles: ['CLINIC_ADMIN'] },
  { to: '/painel/configuracoes', label: 'Configurações', icon: Settings, roles: ['CLINIC_ADMIN'] },
  { to: '/painel/mensagens', label: 'Mensagens', icon: MessageSquare, roles: ['CLINIC_ADMIN'] },
  { to: '/painel/financeiro', label: 'Financeiro', icon: Wallet, roles: ['CLINIC_ADMIN'] },
  { to: '/painel/relatorios', label: 'Relatórios', icon: BarChart3, roles: ['CLINIC_ADMIN'] },
];

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  CLINIC_ADMIN: 'Administrador',
  SECRETARY: 'Secretária',
  PROFESSIONAL: 'Profissional',
  PATIENT: 'Paciente',
};

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: clinic } = useQuery({
    queryKey: ['clinics', 'me'],
    queryFn: async () => (await api.get<ClinicSelf>('/clinics/me')).data,
    enabled: user?.role === 'CLINIC_ADMIN',
  });

  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 border-b px-5">
        <div className="flex items-center gap-2">
          {user.role === 'CLINIC_ADMIN' && clinic ? (
            <ClinicLogo logoUrl={clinic.logoUrl} name={clinic.name} size="sm" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-base font-bold leading-none text-primary">
              {clinic?.name ?? 'CronoCita'}
            </p>
            <p className="text-[11px] text-muted-foreground">Gestão de clínicas</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/painel'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
      </nav>

      <div className="border-t p-4">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        <Button variant="outline" size="sm" className="mt-3 w-full" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">{sidebar}</aside>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-card px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen((v) => !v)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <p className="font-bold text-primary">CronoCita</p>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
