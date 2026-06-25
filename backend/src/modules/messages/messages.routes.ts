import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { validateBody } from '../../shared/middleware/validate';
import { messagesController } from './messages.controller';
import { sendMessageSchema } from './messages.validators';

/** Chat paciente <-> profissional. Autorização por participante (sender/receiver). */
export const messagesRoutes = Router();

messagesRoutes.use(ensureAuthenticated, ensureRole('PATIENT', 'PROFESSIONAL', 'CLINIC_ADMIN'));

messagesRoutes.get('/threads', asyncHandler(messagesController.threads));
messagesRoutes.post('/', validateBody(sendMessageSchema), asyncHandler(messagesController.send));
messagesRoutes.get('/:withUserId', asyncHandler(messagesController.conversation));
