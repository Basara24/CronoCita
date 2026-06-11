import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { ProfessionalsRepository } from './professionals.repository';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsController } from './professionals.controller';
import { createProfessionalSchema, updateProfessionalSchema } from './professionals.validators';

const controller = new ProfessionalsController(
  new ProfessionalsService(new ProfessionalsRepository()),
);

export const professionalsRoutes = Router();

professionalsRoutes.use(ensureAuthenticated);

professionalsRoutes.get(
  '/',
  ensureRole('ADMIN', 'SECRETARY', 'PROFESSIONAL'),
  asyncHandler(controller.list),
);
professionalsRoutes.get(
  '/specialties',
  ensureRole('ADMIN', 'SECRETARY', 'PROFESSIONAL'),
  asyncHandler(controller.listSpecialties),
);
professionalsRoutes.get(
  '/:id',
  ensureRole('ADMIN', 'SECRETARY', 'PROFESSIONAL'),
  asyncHandler(controller.getById),
);
professionalsRoutes.post(
  '/',
  ensureRole('ADMIN'),
  validateBody(createProfessionalSchema),
  asyncHandler(controller.create),
);
professionalsRoutes.put(
  '/:id',
  ensureRole('ADMIN'),
  validateBody(updateProfessionalSchema),
  asyncHandler(controller.update),
);
professionalsRoutes.delete('/:id', ensureRole('ADMIN'), asyncHandler(controller.delete));
