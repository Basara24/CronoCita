import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { PatientLayout } from '@/components/layout/PatientLayout';
import { ProfessionalLayout } from '@/components/layout/ProfessionalLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { Chat } from '@/pages/Chat';
import { Dashboard } from '@/pages/Dashboard';
import { Agenda } from '@/pages/Agenda';
import { Patients } from '@/pages/Patients';
import { Professionals } from '@/pages/Professionals';
import { Rooms } from '@/pages/Rooms';
import { Equipments } from '@/pages/Equipments';
import { Services } from '@/pages/Services';
import { Financial } from '@/pages/Financial';
import { Reports } from '@/pages/Reports';
import { Home } from '@/pages/public/Home';
import { ClinicPage } from '@/pages/public/ClinicPage';
import { PublicBooking } from '@/pages/public/Booking';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { Clinics } from '@/pages/admin/Clinics';
import { AdminUsers } from '@/pages/admin/AdminUsers';
import { Subscriptions } from '@/pages/admin/Subscriptions';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminContacts } from '@/pages/admin/AdminContacts';
import { ClinicSettingsPage } from '@/pages/Settings';
import { PatientDashboardPage } from '@/pages/patient/Dashboard';
import { PatientProfilePage } from '@/pages/patient/Profile';
import { PatientAppointmentsPage } from '@/pages/patient/Appointments';
import { PatientNotificationsPage } from '@/pages/patient/Notifications';
import { PatientHistoryPage } from '@/pages/patient/History';
import { PatientFavoritesPage } from '@/pages/patient/Favorites';
import { PatientClinicsPage } from '@/pages/patient/ClinicsBrowse';
import { ProfessionalDashboardPage } from '@/pages/professional/Dashboard';
import { ProfessionalAgendaPage } from '@/pages/professional/Agenda';
import { ProfessionalServicesPage } from '@/pages/professional/Services';
import { ProfessionalPatientsPage } from '@/pages/professional/Patients';
import { ProfessionalProfilePage } from '@/pages/professional/Profile';

export default function App() {
  return (
    <Routes>
      {/* Marketplace público */}
      <Route path="/" element={<Home />} />
      <Route path="/clinica/:slug" element={<ClinicPage />} />
      <Route path="/clinica/:slug/agendar" element={<PublicBooking />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recuperar-senha" element={<ForgotPassword />} />

      {/* Portal do Paciente (PATIENT) */}
      <Route element={<ProtectedRoute roles={['PATIENT']} />}>
        <Route element={<PatientLayout />}>
          <Route path="/minha-conta" element={<PatientDashboardPage />} />
          <Route path="/clinicas" element={<PatientClinicsPage />} />
          <Route path="/meus-agendamentos" element={<PatientAppointmentsPage />} />
          <Route path="/historico" element={<PatientHistoryPage />} />
          <Route path="/favoritos" element={<PatientFavoritesPage />} />
          <Route path="/perfil" element={<PatientProfilePage />} />
          <Route path="/configuracoes" element={<PatientProfilePage />} />
          <Route path="/notificacoes" element={<PatientNotificationsPage />} />
          <Route path="/mensagens" element={<Chat />} />
        </Route>
      </Route>

      {/* Portal do Profissional (PROFESSIONAL) */}
      <Route element={<ProtectedRoute roles={['PROFESSIONAL']} />}>
        <Route element={<ProfessionalLayout />}>
          <Route path="/profissional" element={<ProfessionalDashboardPage />} />
          <Route path="/profissional/agenda" element={<ProfessionalAgendaPage />} />
          <Route path="/profissional/servicos" element={<ProfessionalServicesPage />} />
          <Route path="/profissional/pacientes" element={<ProfessionalPatientsPage />} />
          <Route path="/profissional/mensagens" element={<Chat />} />
          <Route path="/profissional/perfil" element={<ProfessionalProfilePage />} />
        </Route>
      </Route>

      {/* Área da clínica (CLINIC_ADMIN / SECRETARY) */}
      <Route element={<ProtectedRoute roles={['CLINIC_ADMIN', 'SECRETARY']} />}>
        <Route element={<AppLayout />}>
          <Route path="/painel/agenda" element={<Agenda />} />
          <Route path="/painel/mensagens" element={<Chat />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['CLINIC_ADMIN', 'SECRETARY']} />}>
        <Route element={<AppLayout />}>
          <Route path="/painel/pacientes" element={<Patients />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['CLINIC_ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/painel" element={<Dashboard />} />
          <Route path="/painel/profissionais" element={<Professionals />} />
          <Route path="/painel/salas" element={<Rooms />} />
          <Route path="/painel/equipamentos" element={<Equipments />} />
          <Route path="/painel/servicos" element={<Services />} />
          <Route path="/painel/configuracoes" element={<ClinicSettingsPage />} />
          <Route path="/painel/relatorios" element={<Reports />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['CLINIC_ADMIN']} />}>
        <Route element={<AppLayout />}>
          <Route path="/painel/financeiro" element={<Financial />} />
        </Route>
      </Route>

      {/* Área da plataforma (SUPER_ADMIN) */}
      <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/clinicas" element={<Clinics />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/assinaturas" element={<Subscriptions />} />
          <Route path="/admin/contatos" element={<AdminContacts />} />
          <Route path="/admin/relatorios" element={<AdminReports />} />
          <Route path="/admin/configuracoes" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
