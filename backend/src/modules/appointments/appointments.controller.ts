import { AppointmentStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { ForbiddenError } from '../../shared/errors/AppError';
import { IPatientsRepository } from '../patients/patients.repository';
import { IProfessionalsRepository } from '../professionals/professionals.repository';
import { AppointmentsService } from './appointments.service';

const STATUSES: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'CANCELED', 'FINISHED', 'NO_SHOW'];

export class AppointmentsController {
  constructor(
    private readonly service: AppointmentsService,
    private readonly professionalsRepository: IProfessionalsRepository,
    private readonly patientsRepository: IPatientsRepository,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const { from, to, professionalId, patientId, status } = req.query as Record<
      string,
      string | undefined
    >;

    const filter = {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      professionalId,
      patientId,
      status: status && STATUSES.includes(status as AppointmentStatus)
        ? (status as AppointmentStatus)
        : undefined,
    };

    // Profissional vê apenas a própria agenda; paciente, o próprio histórico
    if (req.user?.role === 'PROFESSIONAL') {
      const professional = await this.professionalsRepository.findByUserId(req.user.id);
      if (!professional) throw new ForbiddenError('Profissional não vinculado ao usuário');
      filter.professionalId = professional.id;
    } else if (req.user?.role === 'PATIENT') {
      const patient = await this.patientsRepository.findByUserId(req.user.id);
      if (!patient) throw new ForbiddenError('Paciente não vinculado ao usuário');
      filter.patientId = patient.id;
    }

    res.json(await this.service.list(filter));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.getById(req.params.id));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.body));
  };

  reschedule = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.reschedule(req.params.id, req.body));
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.service.updateStatus(req.params.id, req.body));
  };
}
