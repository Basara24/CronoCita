import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { PlatformService } from './platform.service';

const service = new PlatformService();

export const platformRoutes = Router();

platformRoutes.use(ensureAuthenticated, ensureRole('SUPER_ADMIN'));

platformRoutes.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    res.json(await service.getMetrics());
  }),
);
