import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { RoomsRepository } from './rooms.repository';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { createRoomSchema, updateRoomSchema } from './rooms.validators';

const controller = new RoomsController(new RoomsService(new RoomsRepository()));

export const roomsRoutes = Router();

roomsRoutes.use(ensureAuthenticated);

roomsRoutes.get('/', ensureRole('ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.list));
roomsRoutes.get('/:id', ensureRole('ADMIN', 'SECRETARY', 'PROFESSIONAL'), asyncHandler(controller.getById));
roomsRoutes.post('/', ensureRole('ADMIN'), validateBody(createRoomSchema), asyncHandler(controller.create));
roomsRoutes.put('/:id', ensureRole('ADMIN'), validateBody(updateRoomSchema), asyncHandler(controller.update));
roomsRoutes.delete('/:id', ensureRole('ADMIN'), asyncHandler(controller.delete));
