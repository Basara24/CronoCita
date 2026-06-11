import { Request, Response } from 'express';
import { ForbiddenError } from '../../shared/errors/AppError';
import { IProfessionalsRepository } from '../professionals/professionals.repository';
import { CommissionsService } from './commissions.service';

export class CommissionsController {
  constructor(
    private readonly service: CommissionsService,
    private readonly professionalsRepository: IProfessionalsRepository,
  ) {}

  private async resolveFilter(req: Request) {
    const { from, to, professionalId } = req.query as Record<string, string | undefined>;
    const filter = {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      professionalId,
    };

    // Profissional só enxerga as próprias comissões
    if (req.user?.role === 'PROFESSIONAL') {
      const professional = await this.professionalsRepository.findByUserId(req.user.id);
      if (!professional) throw new ForbiddenError('Profissional não vinculado ao usuário');
      filter.professionalId = professional.id;
    }

    return filter;
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const filter = await this.resolveFilter(req);
    res.json(await this.service.list(filter));
  };

  summary = async (req: Request, res: Response): Promise<void> => {
    const filter = await this.resolveFilter(req);
    res.json(await this.service.summary(filter));
  };
}
