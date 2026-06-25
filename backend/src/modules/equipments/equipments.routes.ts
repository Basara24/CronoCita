import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { ensureClinic } from '../../shared/middleware/ensureClinic';
import { EquipmentsRepository } from './equipments.repository';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { createEquipmentSchema, updateEquipmentSchema } from './equipments.validators';

const controller = new EquipmentsController(new EquipmentsService(new EquipmentsRepository()));

export const equipmentsRoutes = Router();

equipmentsRoutes.use(ensureAuthenticated, ensureClinic);

equipmentsRoutes.get('/', ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.list));
equipmentsRoutes.get('/:id', ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.getById));
equipmentsRoutes.post('/', ensureRole('CLINIC_ADMIN'), validateBody(createEquipmentSchema), asyncHandler(controller.create));
equipmentsRoutes.put('/:id', ensureRole('CLINIC_ADMIN'), validateBody(updateEquipmentSchema), asyncHandler(controller.update));
equipmentsRoutes.delete('/:id', ensureRole('CLINIC_ADMIN'), asyncHandler(controller.delete));
