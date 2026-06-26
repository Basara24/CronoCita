import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { validateBody } from '../../shared/middleware/validate';
import { serviceUpload } from '../../shared/upload/multer';
import { professionalPortalController } from './professional-portal.controller';
import {
  createBlockSchema,
  createServiceSchema,
  rescheduleSchema,
  updateProfileSchema,
  updateServiceSchema,
} from './professional-portal.validators';

/** Portal do Profissional (/api/professional) — escopado por professional.userId. */
export const professionalPortalRoutes = Router();

professionalPortalRoutes.use(ensureAuthenticated, ensureRole('PROFESSIONAL'));

professionalPortalRoutes.get('/dashboard', asyncHandler(professionalPortalController.dashboard));

professionalPortalRoutes.get('/appointments', asyncHandler(professionalPortalController.listAppointments));
professionalPortalRoutes.patch(
  '/appointments/:id/cancel',
  asyncHandler(professionalPortalController.cancelAppointment),
);
professionalPortalRoutes.patch(
  '/appointments/:id/reschedule',
  validateBody(rescheduleSchema),
  asyncHandler(professionalPortalController.rescheduleAppointment),
);

professionalPortalRoutes.get('/blocks', asyncHandler(professionalPortalController.listBlocks));
professionalPortalRoutes.post(
  '/blocks',
  validateBody(createBlockSchema),
  asyncHandler(professionalPortalController.createBlock),
);
professionalPortalRoutes.delete('/blocks/:id', asyncHandler(professionalPortalController.removeBlock));

professionalPortalRoutes.get('/services', asyncHandler(professionalPortalController.listServices));
professionalPortalRoutes.post(
  '/services',
  validateBody(createServiceSchema),
  asyncHandler(professionalPortalController.createService),
);
professionalPortalRoutes.put(
  '/services/:id',
  validateBody(updateServiceSchema),
  asyncHandler(professionalPortalController.updateService),
);
professionalPortalRoutes.delete('/services/:id', asyncHandler(professionalPortalController.removeService));
professionalPortalRoutes.post(
  '/services/upload',
  serviceUpload.single('image'),
  asyncHandler(professionalPortalController.uploadServiceImage),
);

professionalPortalRoutes.get('/patients', asyncHandler(professionalPortalController.listPatients));
professionalPortalRoutes.get(
  '/patients/:patientId/history',
  asyncHandler(professionalPortalController.patientHistory),
);

professionalPortalRoutes.get('/profile', asyncHandler(professionalPortalController.getProfile));
professionalPortalRoutes.put(
  '/profile',
  validateBody(updateProfileSchema),
  asyncHandler(professionalPortalController.updateProfile),
);

professionalPortalRoutes.get(
  '/messaging/contacts',
  asyncHandler(professionalPortalController.listMessagingContacts),
);
