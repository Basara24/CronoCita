import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { clinicUpload } from '../../shared/upload/multer';
import { ClinicsRepository } from './clinics.repository';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { clinicsSelfController } from './clinics.self.controller';
import {
  addPhotoSchema,
  createClinicSchema,
  updateClinicSchema,
  updateOwnClinicSchema,
  updateStatusSchema,
} from './clinics.validators';

const controller = new ClinicsController(new ClinicsService(new ClinicsRepository()));

export const clinicsRoutes = Router();

// Rotas da própria clínica (CLINIC_ADMIN) — registradas antes do guard de SUPER_ADMIN.
clinicsRoutes.get(
  '/me',
  ensureAuthenticated,
  ensureRole('CLINIC_ADMIN'),
  asyncHandler(clinicsSelfController.get),
);
clinicsRoutes.put(
  '/me',
  ensureAuthenticated,
  ensureRole('CLINIC_ADMIN'),
  validateBody(updateOwnClinicSchema),
  asyncHandler(clinicsSelfController.update),
);
clinicsRoutes.post(
  '/me/upload',
  ensureAuthenticated,
  ensureRole('CLINIC_ADMIN'),
  clinicUpload.single('image'),
  asyncHandler(clinicsSelfController.uploadImage),
);
clinicsRoutes.get(
  '/me/photos',
  ensureAuthenticated,
  ensureRole('CLINIC_ADMIN'),
  asyncHandler(clinicsSelfController.get),
);
clinicsRoutes.post(
  '/me/photos',
  ensureAuthenticated,
  ensureRole('CLINIC_ADMIN'),
  validateBody(addPhotoSchema),
  asyncHandler(clinicsSelfController.addPhoto),
);
clinicsRoutes.post(
  '/me/photos/upload',
  ensureAuthenticated,
  ensureRole('CLINIC_ADMIN'),
  clinicUpload.single('image'),
  asyncHandler(clinicsSelfController.uploadPhoto),
);
clinicsRoutes.delete(
  '/me/photos/:photoId',
  ensureAuthenticated,
  ensureRole('CLINIC_ADMIN'),
  asyncHandler(clinicsSelfController.removePhoto),
);

clinicsRoutes.use(ensureAuthenticated, ensureRole('SUPER_ADMIN'));

clinicsRoutes.get('/', asyncHandler(controller.list));
clinicsRoutes.get('/:id', asyncHandler(controller.getById));
clinicsRoutes.post('/', validateBody(createClinicSchema), asyncHandler(controller.create));
clinicsRoutes.put('/:id', validateBody(updateClinicSchema), asyncHandler(controller.update));
clinicsRoutes.patch('/:id/status', validateBody(updateStatusSchema), asyncHandler(controller.setStatus));
clinicsRoutes.delete('/:id', asyncHandler(controller.delete));
