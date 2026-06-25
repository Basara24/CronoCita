import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { createSubscriptionSchema, updateSubscriptionSchema } from './subscriptions.validators';

const controller = new SubscriptionsController(new SubscriptionsService());

export const subscriptionsRoutes = Router();

subscriptionsRoutes.use(ensureAuthenticated, ensureRole('SUPER_ADMIN'));

subscriptionsRoutes.get('/', asyncHandler(controller.list));
subscriptionsRoutes.get('/:id', asyncHandler(controller.getById));
subscriptionsRoutes.post('/', validateBody(createSubscriptionSchema), asyncHandler(controller.create));
subscriptionsRoutes.put('/:id', validateBody(updateSubscriptionSchema), asyncHandler(controller.update));
subscriptionsRoutes.delete('/:id', asyncHandler(controller.delete));
