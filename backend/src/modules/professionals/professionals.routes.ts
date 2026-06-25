import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { ensureClinic } from '../../shared/middleware/ensureClinic';
import { ProfessionalsRepository } from './professionals.repository';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { createProfessionalSchema, updateProfessionalSchema } from './professionals.validators';

const controller = new ProfessionalsController(
  new ProfessionalsService(new ProfessionalsRepository()),
);

export const professionalsRoutes = Router();

professionalsRoutes.use(ensureAuthenticated, ensureClinic);

professionalsRoutes.get(
  '/',
  ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'),
  asyncHandler(controller.list),
);
professionalsRoutes.get(
  '/specialties',
  ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'),
  asyncHandler(controller.listSpecialties),
);
professionalsRoutes.get(
  '/:id',
  ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'),
  asyncHandler(controller.getById),
);
professionalsRoutes.post(
  '/',
  ensureRole('CLINIC_ADMIN'),
  validateBody(createProfessionalSchema),
  asyncHandler(controller.create),
);
professionalsRoutes.put(
  '/:id',
  ensureRole('CLINIC_ADMIN'),
  validateBody(updateProfessionalSchema),
  asyncHandler(controller.update),
);
professionalsRoutes.delete('/:id', ensureRole('CLINIC_ADMIN'), asyncHandler(controller.delete));
