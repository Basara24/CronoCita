import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { ensureClinic } from '../../shared/middleware/ensureClinic';
import { ServicesRepository } from './services.repository';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { createServiceSchema, updateServiceSchema } from './services.validators';

const controller = new ServicesController(new ServicesService(new ServicesRepository()));

export const servicesRoutes = Router();

servicesRoutes.use(ensureAuthenticated, ensureClinic);

servicesRoutes.get('/', ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.list));
servicesRoutes.get('/:id', ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.getById));
servicesRoutes.post('/', ensureRole('CLINIC_ADMIN'), validateBody(createServiceSchema), asyncHandler(controller.create));
servicesRoutes.put('/:id', ensureRole('CLINIC_ADMIN'), validateBody(updateServiceSchema), asyncHandler(controller.update));
servicesRoutes.delete('/:id', ensureRole('CLINIC_ADMIN'), asyncHandler(controller.delete));
