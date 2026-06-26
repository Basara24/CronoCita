import express from 'express';
import cors from 'cors';
import { UPLOAD_ROOT } from './shared/upload/multer';
import { errorHandler } from './shared/middleware/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { patientsRoutes } from './modules/patients/patients.routes';
import { professionalsRoutes } from './modules/professionals/professionals.routes';
import { roomsRoutes } from './modules/rooms/rooms.routes';
import { equipmentsRoutes } from './modules/equipments/equipments.routes';
import { servicesRoutes } from './modules/services/services.routes';
import { appointmentsRoutes } from './modules/appointments/appointments.routes';
import { publicRoutes } from './modules/appointments/public.routes';
import { commissionsRoutes } from './modules/commissions/commissions.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { clinicsRoutes } from './modules/clinics/clinics.routes';
import { subscriptionsRoutes } from './modules/subscriptions/subscriptions.routes';
import { platformRoutes } from './modules/platform/platform.routes';
import { patientPortalRoutes } from './modules/patient-portal/patient-portal.routes';
import { messagesRoutes } from './modules/messages/messages.routes';
import { contactsRoutes } from './modules/contacts/contacts.routes';
import { professionalPortalRoutes } from './modules/professional-portal/professional-portal.routes';

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Arquivos enviados (avatares) servidos estaticamente
  app.use('/uploads', express.static(UPLOAD_ROOT));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'cronocita-api' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/professionals', professionalsRoutes);
  app.use('/api/rooms', roomsRoutes);
  app.use('/api/equipments', equipmentsRoutes);
  app.use('/api/services', servicesRoutes);
  app.use('/api/appointments', appointmentsRoutes);
  app.use('/api/commissions', commissionsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/clinics', clinicsRoutes);
  app.use('/api/subscriptions', subscriptionsRoutes);
  app.use('/api/admin', platformRoutes);
  app.use('/api/me', patientPortalRoutes);
  app.use('/api/professional', professionalPortalRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/public', publicRoutes);

  app.use(errorHandler);

  return app;
}
