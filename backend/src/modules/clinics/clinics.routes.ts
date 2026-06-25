import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { ClinicsRepository } from './clinics.repository';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { createClinicSchema, updateClinicSchema, updateStatusSchema } from './clinics.validators';

const controller = new ClinicsController(new ClinicsService(new ClinicsRepository()));

export const clinicsRoutes = Router();

clinicsRoutes.use(ensureAuthenticated, ensureRole('SUPER_ADMIN'));

clinicsRoutes.get('/', asyncHandler(controller.list));
clinicsRoutes.get('/:id', asyncHandler(controller.getById));
clinicsRoutes.post('/', validateBody(createClinicSchema), asyncHandler(controller.create));
clinicsRoutes.put('/:id', validateBody(updateClinicSchema), asyncHandler(controller.update));
clinicsRoutes.patch('/:id/status', validateBody(updateStatusSchema), asyncHandler(controller.setStatus));
clinicsRoutes.delete('/:id', asyncHandler(controller.delete));
