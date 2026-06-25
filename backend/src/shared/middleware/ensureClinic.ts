import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';

/**
 * Garante que a requisição está vinculada a uma clínica.
 *
 * - Usuários de clínica (CLINIC_ADMIN/SECRETARY/PROFESSIONAL) usam o `clinicId`
 *   presente no token.
 * - SUPER_ADMIN pode operar sobre uma clínica específica informando `?clinicId=`
 *   na query (ou no body).
 *
 * Em ambos os casos o `clinicId` resolvido é exposto em `req.clinicId`.
 */
export function ensureClinic(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  const clinicId = resolveClinicId(req);
  if (!clinicId) {
    throw new ForbiddenError('Contexto de clínica não definido');
  }

  req.clinicId = clinicId;
  next();
}

/**
 * Resolve o `clinicId` aplicável à requisição.
 * SUPER_ADMIN pode informar a clínica alvo via query/body; os demais usam o token.
 */
export function resolveClinicId(req: Request): string | undefined {
  if (!req.user) {
    return undefined;
  }

  if (req.user.role === 'SUPER_ADMIN') {
    const fromQuery = (req.query.clinicId as string | undefined) ?? undefined;
    const fromBody =
      req.body && typeof req.body === 'object' ? (req.body.clinicId as string | undefined) : undefined;
    return fromQuery || fromBody || undefined;
  }

  return req.user.clinicId ?? undefined;
}
