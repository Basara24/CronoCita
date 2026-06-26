import { Request, Response } from 'express';
import { favoritesService } from './favorites.service';

export class FavoritesController {
  list = async (req: Request, res: Response): Promise<void> => {
    res.json(await favoritesService.list(req.user!.id));
  };

  add = async (req: Request, res: Response): Promise<void> => {
    await favoritesService.add(req.user!.id, req.params.clinicId);
    res.status(201).json({ message: 'Clínica adicionada aos favoritos.' });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await favoritesService.remove(req.user!.id, req.params.clinicId);
    res.json({ message: 'Clínica removida dos favoritos.' });
  };
}

export const favoritesController = new FavoritesController();
