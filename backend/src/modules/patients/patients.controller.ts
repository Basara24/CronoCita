import { Request, Response } from 'express';
import { PatientsService } from './patients.service';

export class PatientsController {
  constructor(private readonly service: PatientsService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.list(req.clinicId as string, req.query.search as string | undefined));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getById(req.clinicId as string, req.params.id));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.clinicId as string, req.body));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.update(req.clinicId as string, req.params.id, req.body));
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.service.delete(req.clinicId as string, req.params.id);
    res.status(204).send();
  };
}
