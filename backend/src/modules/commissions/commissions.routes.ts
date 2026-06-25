import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { ensureClinic } from '../../shared/middleware/ensureClinic';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { CommissionsRepository } from './commissions.repository';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';

const controller = new CommissionsController(
  new CommissionsService(new CommissionsRepository()),
  new ProfessionalsRepository(),
);

export const commissionsRoutes = Router();

commissionsRoutes.use(ensureAuthenticated, ensureClinic, ensureRole('CLINIC_ADMIN', 'PROFESSIONAL'));

commissionsRoutes.get('/', asyncHandler(controller.list));
commissionsRoutes.get('/summary', asyncHandler(controller.summary));
