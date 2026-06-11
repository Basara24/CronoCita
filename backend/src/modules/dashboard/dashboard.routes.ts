import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { ensureAuthenticated } from '../../shared/middleware/ensureAuthenticated';
import { ensureRole } from '../../shared/middleware/ensureRole';
import { DashboardRepository } from './dashboard.repository';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

const controller = new DashboardController(new DashboardService(new DashboardRepository()));

export const dashboardRoutes = Router();

dashboardRoutes.use(ensureAuthenticated, ensureRole('ADMIN'));

dashboardRoutes.get('/kpis', asyncHandler(controller.kpis));
dashboardRoutes.get('/charts', asyncHandler(controller.charts));
