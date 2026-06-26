import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { validateBody } from '../../shared/middleware/validate';
import { contactsController } from './contacts.controller';
import { updateContactStatusSchema } from './contacts.validators';

/** Gestão de contatos (Fale Conosco) — exclusivo do SUPER_ADMIN. */
export const contactsRoutes = Router();

contactsRoutes.use(ensureAuthenticated, ensureRole('SUPER_ADMIN'));

contactsRoutes.get('/', asyncHandler(contactsController.list));
contactsRoutes.patch(
  '/:id/status',
  validateBody(updateContactStatusSchema),
  asyncHandler(contactsController.updateStatus),
);
