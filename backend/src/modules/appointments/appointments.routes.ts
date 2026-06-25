import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { ensureClinic } from '../../shared/middleware/ensureClinic';
import { PatientsRepository } from '../patients/patients.repository';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { AppointmentsController } from './appointments.controller';
import { makeAppointmentsService } from './appointments.factory';
import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  updateStatusSchema,
} from './appointments.validators';

const controller = new AppointmentsController(
  makeAppointmentsService(),
  new ProfessionalsRepository(),
  new PatientsRepository(),
);

export const appointmentsRoutes = Router();

appointmentsRoutes.use(ensureAuthenticated, ensureClinic);

appointmentsRoutes.get(
  '/',
  ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL', 'PATIENT'),
  asyncHandler(controller.list),
);
appointmentsRoutes.get(
  '/:id',
  ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL', 'PATIENT'),
  asyncHandler(controller.getById),
);
appointmentsRoutes.post(
  '/',
  ensureRole('CLINIC_ADMIN', 'SECRETARY'),
  validateBody(createAppointmentSchema),
  asyncHandler(controller.create),
);
appointmentsRoutes.put(
  '/:id/reschedule',
  ensureRole('CLINIC_ADMIN', 'SECRETARY'),
  validateBody(rescheduleAppointmentSchema),
  asyncHandler(controller.reschedule),
);
appointmentsRoutes.patch(
  '/:id/status',
  ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL', 'PATIENT'),
  validateBody(updateStatusSchema),
  asyncHandler(controller.updateStatus),
);
