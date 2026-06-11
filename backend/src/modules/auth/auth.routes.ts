import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.validators';

const controller = new AuthController(new AuthService(new AuthRepository()));

export const authRoutes = Router();

authRoutes.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
authRoutes.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
authRoutes.post('/refresh', validateBody(refreshSchema), asyncHandler(controller.refresh));
authRoutes.post('/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
authRoutes.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(controller.resetPassword));
