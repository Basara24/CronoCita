import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

function resolvePeriod(req: Request): { from: Date; to: Date } {
  const { from, to } = req.query as Record<string, string | undefined>;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86_400_000);
  const toDate = to ? new Date(to) : new Date(Date.now() + 7 * 86_400_000);
  return { from: fromDate, to: toDate };
}

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  kpis = async (req: Request, res: Response): Promise<void> => {
    const { from, to } = resolvePeriod(req);
    res.json(await this.service.getKpis(from, to));
  };

  charts = async (req: Request, res: Response): Promise<void> => {
    const { from, to } = resolvePeriod(req);
    res.json(await this.service.getCharts(from, to));
  };
}
