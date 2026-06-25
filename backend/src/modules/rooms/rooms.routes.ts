import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { ensureClinic } from '../../shared/middleware/ensureClinic';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { createRoomSchema, updateRoomSchema } from './rooms.validators';

const controller = new RoomsController(new RoomsService(new RoomsRepository()));

export const roomsRoutes = Router();

roomsRoutes.use(ensureAuthenticated, ensureClinic);

roomsRoutes.get('/', ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.list));
roomsRoutes.get('/:id', ensureRole('CLINIC_ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.getById));
roomsRoutes.post('/', ensureRole('CLINIC_ADMIN'), validateBody(createRoomSchema), asyncHandler(controller.create));
roomsRoutes.put('/:id', ensureRole('CLINIC_ADMIN'), validateBody(updateRoomSchema), asyncHandler(controller.update));
roomsRoutes.delete('/:id', ensureRole('CLINIC_ADMIN'), asyncHandler(controller.delete));
