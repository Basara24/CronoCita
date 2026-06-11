import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';
import { authConfig } from '../utils/authConfig';

export interface TokenPayload {
  sub: string;
  role: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: string; name: string };
    }
  }
}

export function ensureAuthenticated(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token não informado');
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, authConfig.jwtSecret) as unknown as TokenPayload;
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    throw new UnauthorizedError('Token inválido ou expirado');
  }
}
