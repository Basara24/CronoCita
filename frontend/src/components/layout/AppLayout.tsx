import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Box,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Role } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL', 'PATIENT'] },
  { to: '/pacientes', label: 'Pacientes', icon: Users, roles: ['ADMIN', 'SECRETARY'] },
  { to: '/profissionais', label: 'Profissionais', icon: Stethoscope, roles: ['ADMIN'] },
  { to: '/salas', label: 'Salas', icon: DoorOpen, roles: ['ADMIN'] },
  { to: '/equipamentos', label: 'Equipamentos', icon: Box, roles: ['ADMIN'] },
  { to: '/servicos', label: 'Serviços', icon: ClipboardList, roles: ['ADMIN'] },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, roles: ['ADMIN', 'PROFESSIONAL'] },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3, roles: ['ADMIN'] },
];

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  SECRETARY: 'Secretária',
  PROFESSIONAL: 'Profissional',
  PATIENT: 'Paciente',
};

export function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-bold leading-none text-primary">CronoCita</p>
          <p className="text-[11px] text-muted-foreground">Gestão de clínicas</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
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
