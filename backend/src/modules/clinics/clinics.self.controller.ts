import { Request, Response } from 'express';
import { ClinicPhotoCategory } from '@prisma/client';
import { AppError } from '../../shared/errors/AppError';
import { clinicPublicUrl } from '../../shared/upload/multer';
import { clinicsSelfService } from './clinics.self.service';

export class ClinicsSelfController {
  get = async (req: Request, res: Response): Promise<void> => {
    res.json(await clinicsSelfService.get(req.user!.clinicId));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await clinicsSelfService.update(req.user!.clinicId, req.body));
  };

  addPhoto = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(
      await clinicsSelfService.addPhoto(
        req.user!.clinicId,
        req.body.url,
        req.body.category as ClinicPhotoCategory | undefined,
        req.body.caption,
      ),
    );
  };

  uploadPhoto = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new AppError('Nenhum arquivo enviado');
    const url = clinicPublicUrl(req.file.filename);
    const { category, caption } = req.body as Record<string, string | undefined>;
    res.status(201).json(
      await clinicsSelfService.addPhoto(
        req.user!.clinicId,
        url,
        category as ClinicPhotoCategory | undefined,
        caption,
      ),
    );
  };

  removePhoto = async (req: Request, res: Response): Promise<void> => {
    await clinicsSelfService.removePhoto(req.user!.clinicId, req.params.photoId);
    res.json({ message: 'Foto removida.' });
  };

  uploadImage = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new AppError('Nenhum arquivo enviado');
    res.status(201).json({ url: clinicPublicUrl(req.file.filename) });
  };
}

export const clinicsSelfController = new ClinicsSelfController();
