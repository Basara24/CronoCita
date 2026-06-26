import { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { servicePublicUrl } from '../../shared/upload/multer';
import { professionalPortalService } from './professional-portal.service';

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export class ProfessionalPortalController {
  dashboard = async (req: Request, res: Response): Promise<void> => {
    res.json(await professionalPortalService.dashboard(req.user!.id));
  };

  listAppointments = async (req: Request, res: Response): Promise<void> => {
    const { from, to } = req.query as Record<string, string | undefined>;
    res.json(
      await professionalPortalService.listAppointments(req.user!.id, {
        from: parseDate(from),
        to: parseDate(to),
      }),
    );
  };

  cancelAppointment = async (req: Request, res: Response): Promise<void> => {
    res.json(await professionalPortalService.cancelAppointment(req.user!.id, req.params.id));
  };

  rescheduleAppointment = async (req: Request, res: Response): Promise<void> => {
    res.json(
      await professionalPortalService.rescheduleAppointment(req.user!.id, req.params.id, req.body.startsAt),
    );
  };

  listBlocks = async (req: Request, res: Response): Promise<void> => {
    const { from, to } = req.query as Record<string, string | undefined>;
    res.json(
      await professionalPortalService.listBlocks(req.user!.id, {
        from: parseDate(from),
        to: parseDate(to),
      }),
    );
  };

  createBlock = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await professionalPortalService.createBlock(req.user!.id, req.body));
  };

  removeBlock = async (req: Request, res: Response): Promise<void> => {
    await professionalPortalService.removeBlock(req.user!.id, req.params.id);
    res.json({ message: 'Bloqueio removido.' });
  };

  listServices = async (req: Request, res: Response): Promise<void> => {
    res.json(await professionalPortalService.listServices(req.user!.id));
  };

  createService = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await professionalPortalService.createService(req.user!.id, req.body));
  };

  updateService = async (req: Request, res: Response): Promise<void> => {
    res.json(await professionalPortalService.updateService(req.user!.id, req.params.id, req.body));
  };

  removeService = async (req: Request, res: Response): Promise<void> => {
    await professionalPortalService.removeService(req.user!.id, req.params.id);
    res.json({ message: 'Serviço removido.' });
  };

  uploadServiceImage = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new AppError('Nenhum arquivo enviado');
    res.status(201).json({ url: servicePublicUrl(req.file.filename) });
  };

  listPatients = async (req: Request, res: Response): Promise<void> => {
    res.json(await professionalPortalService.listPatients(req.user!.id));
  };

  patientHistory = async (req: Request, res: Response): Promise<void> => {
    res.json(await professionalPortalService.patientHistory(req.user!.id, req.params.patientId));
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    res.json(await professionalPortalService.getProfile(req.user!.id));
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    res.json(await professionalPortalService.updateProfile(req.user!.id, req.body));
  };
}

export const professionalPortalController = new ProfessionalPortalController();
