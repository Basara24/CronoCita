import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { validateBody } from '../../shared/middleware/validate';
import { avatarUpload } from '../../shared/upload/multer';
import { patientPortalController } from './patient-portal.controller';
import { changePasswordSchema, updateProfileSchema } from './patient-portal.validators';

/**
 * Portal do Paciente (/api/me): agrega dados de TODAS as clínicas do paciente.
 * Não usa ensureClinic — o escopo é o usuário (PATIENT), não uma clínica.
 */
export const patientPortalRoutes = Router();

patientPortalRoutes.use(ensureAuthenticated, ensureRole('PATIENT'));

patientPortalRoutes.get('/dashboard', asyncHandler(patientPortalController.dashboard));

patientPortalRoutes.get('/appointments', asyncHandler(patientPortalController.listAppointments));
patientPortalRoutes.patch('/appointments/:id/cancel', asyncHandler(patientPortalController.cancelAppointment));

patientPortalRoutes.get('/profile', asyncHandler(patientPortalController.getProfile));
patientPortalRoutes.put('/profile', validateBody(updateProfileSchema), asyncHandler(patientPortalController.updateProfile));
patientPortalRoutes.put('/password', validateBody(changePasswordSchema), asyncHandler(patientPortalController.changePassword));
patientPortalRoutes.post('/avatar', avatarUpload.single('avatar'), asyncHandler(patientPortalController.uploadAvatar));

patientPortalRoutes.get('/notifications', asyncHandler(patientPortalController.listNotifications));
patientPortalRoutes.patch('/notifications/read-all', asyncHandler(patientPortalController.markAllNotificationsRead));
patientPortalRoutes.patch('/notifications/:id/read', asyncHandler(patientPortalController.markNotificationRead));
