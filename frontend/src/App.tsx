import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Agenda } from '@/pages/Agenda';
import { Patients } from '@/pages/Patients';
import { Professionals } from '@/pages/Professionals';
import { Rooms } from '@/pages/Rooms';
import { Equipments } from '@/pages/Equipments';
import { Services } from '@/pages/Services';
import { Financial } from '@/pages/Financial';
import { Reports } from '@/pages/Reports';
import { PublicBooking } from '@/pages/public/Booking';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'ADMIN' ? <Dashboard /> : <Navigate to="/agenda" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/agendar" element={<PublicBooking />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/agenda" element={<Agenda />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN', 'SECRETARY']} />}>
        <Route element={<AppLayout />}>
          <Route path="/pacientes" element={<Patients />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/profissionais" element={<Professionals />} />
          <Route path="/salas" element={<Rooms />} />
          <Route path="/equipamentos" element={<Equipments />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/relatorios" element={<Reports />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN', 'PROFESSIONAL']} />}>
        <Route element={<AppLayout />}>
          <Route path="/financeiro" element={<Financial />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
