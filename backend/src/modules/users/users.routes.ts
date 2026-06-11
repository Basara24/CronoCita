import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { createUserSchema, updateUserSchema } from './users.validators';

const controller = new UsersController(new UsersService(new UsersRepository()));

export const usersRoutes = Router();

usersRoutes.use(ensureAuthenticated, ensureRole('ADMIN'));

usersRoutes.get('/', asyncHandler(controller.list));
usersRoutes.get('/:id', asyncHandler(controller.getById));
usersRoutes.post('/', validateBody(createUserSchema), asyncHandler(controller.create));
usersRoutes.put('/:id', validateBody(updateUserSchema), asyncHandler(controller.update));
usersRoutes.delete('/:id', asyncHandler(controller.delete));
