import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { AppError } from '../../shared/errors/AppError';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { ServicesRepository } from '../services/services.repository';
import { makeAppointmentsService } from './appointments.factory';
import { publicBookingSchema } from './appointments.validators';

const appointmentsService = makeAppointmentsService();
const professionalsRepository = new ProfessionalsRepository();
const servicesRepository = new ServicesRepository();

/**
 * Portal público de agendamento online — não exige autenticação.
 */
export const publicRoutes = Router();

publicRoutes.get(
  '/specialties',
  asyncHandler(async (_req, res) => {
    res.json(await professionalsRepository.listSpecialties());
  }),
);

publicRoutes.get(
  '/professionals',
  asyncHandler(async (req, res) => {
    const specialty = req.query.specialty as string | undefined;
    const professionals = await professionalsRepository.findAll(specialty);
    res.json(
      professionals.map((p) => ({ id: p.id, name: p.name, specialty: p.specialty })),
    );
  }),
);

publicRoutes.get(
  '/services',
  asyncHandler(async (_req, res) => {
    const services = await servicesRepository.findAll();
    res.json(
      services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        price: s.price,
      })),
    );
  }),
);

publicRoutes.get(
  '/availability',
  asyncHandler(async (req, res) => {
    const { professionalId, serviceId, date } = req.query as Record<string, string | undefined>;
    if (!professionalId || !serviceId || !date) {
      throw new AppError('Informe professionalId, serviceId e date (YYYY-MM-DD)');
    }
    res.json(await appointmentsService.getAvailableSlots(professionalId, serviceId, date));
  }),
);

publicRoutes.post(
  '/appointments',
  validateBody(publicBookingSchema),
  asyncHandler(async (req, res) => {
    const appointment = await appointmentsService.publicBooking(req.body);
    res.status(201).json({
      id: appointment.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      professional: appointment.professional.name,
      service: appointment.service.name,
      patient: appointment.patient.name,
      status: appointment.status,
    });
  }),
);
