import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { createPatientSchema, updatePatientSchema } from './patients.validators';

const controller = new PatientsController(new PatientsService(new PatientsRepository()));

export const patientsRoutes = Router();

patientsRoutes.use(ensureAuthenticated, ensureRole('ADMIN', 'SECRETARY'));

patientsRoutes.get('/', asyncHandler(controller.list));
patientsRoutes.get('/:id', asyncHandler(controller.getById));
patientsRoutes.post('/', validateBody(createPatientSchema), asyncHandler(controller.create));
patientsRoutes.put('/:id', validateBody(updatePatientSchema), asyncHandler(controller.update));
patientsRoutes.delete('/:id', asyncHandler(controller.delete));
