import express from 'express';
import cors from 'cors';
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

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

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
  app.use('/api/public', publicRoutes);

  app.use(errorHandler);

  return app;
}
