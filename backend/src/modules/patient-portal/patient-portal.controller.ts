import { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { avatarPublicUrl } from '../../shared/upload/multer';
import { userNotificationService } from '../notifications/userNotification.service';
import { patientPortalService } from './patient-portal.service';

type Period = 'today' | 'week' | 'month' | 'all';

export class PatientPortalController {
  dashboard = async (req: Request, res: Response): Promise<void> => {
    res.json(await patientPortalService.dashboard(req.user!.id));
  };

  listAppointments = async (req: Request, res: Response): Promise<void> => {
    const { scope, period, search, clinicId } = req.query as Record<string, string | undefined>;
    res.json(
      await patientPortalService.listAppointments(req.user!.id, {
        scope: scope === 'history' ? 'history' : 'upcoming',
        period: (period as Period) ?? 'all',
        search: search || undefined,
        clinicId: clinicId || undefined,
      }),
    );
  };

  cancelAppointment = async (req: Request, res: Response): Promise<void> => {
    res.json(await patientPortalService.cancelAppointment(req.user!.id, req.params.id));
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    res.json(await patientPortalService.getProfile(req.user!.id));
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    res.json(await patientPortalService.updateProfile(req.user!.id, req.body));
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    await patientPortalService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    res.json({ message: 'Senha alterada com sucesso.' });
  };

  uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new AppError('Nenhum arquivo enviado');
    const url = avatarPublicUrl(req.file.filename);
    res.json(await patientPortalService.updateAvatar(req.user!.id, url));
  };

  listNotifications = async (req: Request, res: Response): Promise<void> => {
    res.json(await userNotificationService.listForUser(req.user!.id));
  };

  markNotificationRead = async (req: Request, res: Response): Promise<void> => {
    await userNotificationService.markAsRead(req.user!.id, req.params.id);
    res.json({ message: 'Notificação marcada como lida.' });
  };

  markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
    await userNotificationService.markAllAsRead(req.user!.id);
    res.json({ message: 'Notificações marcadas como lidas.' });
  };
}

export const patientPortalController = new PatientPortalController();
