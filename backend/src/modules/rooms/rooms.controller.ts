import { Request, Response } from 'express';
import { RoomsService } from './rooms.service';

export class RoomsController {
  constructor(private readonly service: RoomsService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.service.list());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getById(req.params.id));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.body));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.update(req.params.id, req.body));
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  };
}
