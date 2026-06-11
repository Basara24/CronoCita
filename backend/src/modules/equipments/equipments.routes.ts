import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { EquipmentsRepository } from './equipments.repository';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { createEquipmentSchema, updateEquipmentSchema } from './equipments.validators';

const controller = new EquipmentsController(new EquipmentsService(new EquipmentsRepository()));

export const equipmentsRoutes = Router();

equipmentsRoutes.use(ensureAuthenticated);

equipmentsRoutes.get('/', ensureRole('ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.list));
equipmentsRoutes.get('/:id', ensureRole('ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.getById));
equipmentsRoutes.post('/', ensureRole('ADMIN'), validateBody(createEquipmentSchema), asyncHandler(controller.create));
equipmentsRoutes.put('/:id', ensureRole('ADMIN'), validateBody(updateEquipmentSchema), asyncHandler(controller.update));
equipmentsRoutes.delete('/:id', ensureRole('ADMIN'), asyncHandler(controller.delete));
