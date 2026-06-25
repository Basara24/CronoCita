import { Router } from 'express';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { prisma } from '../../shared/database/prisma';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { ServicesRepository } from '../services/services.repository';
import { makeAppointmentsService } from './appointments.factory';
import { publicBookingSchema } from './appointments.validators';

const appointmentsService = makeAppointmentsService();
const professionalsRepository = new ProfessionalsRepository();
const servicesRepository = new ServicesRepository();

/**
 * API pública do marketplace — não exige autenticação.
 * As clínicas são acessadas pelo slug e os recursos são escopados por clínica.
 */
export const publicRoutes = Router();

async function resolveActiveClinic(slug: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    include: { specialties: true },
  });
  if (!clinic || clinic.status !== 'ACTIVE') {
    throw new NotFoundError('Clínica não encontrada');
  }
  return clinic;
}

/** Lista clínicas ativas com filtros opcionais (nome, cidade, especialidade). */
publicRoutes.get(
  '/clinics',
  asyncHandler(async (req, res) => {
    const { name, city, specialty } = req.query as Record<string, string | undefined>;

    const clinics = await prisma.clinic.findMany({
      where: {
        status: 'ACTIVE',
        ...(name ? { name: { contains: name } } : {}),
        ...(city ? { city: { contains: city } } : {}),
        ...(specialty ? { specialties: { some: { specialty } } } : {}),
      },
      include: { specialties: true },
      orderBy: { name: 'asc' },
    });

    res.json(
      clinics.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        city: c.city,
        state: c.state,
        logoUrl: c.logoUrl,
        description: c.description,
        specialties: c.specialties.map((s) => s.specialty),
      })),
    );
  }),
);

/** Lista todas as especialidades disponíveis no marketplace (para filtro da Home). */
publicRoutes.get(
  '/specialties',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.clinicSpecialty.findMany({
      distinct: ['specialty'],
      orderBy: { specialty: 'asc' },
      select: { specialty: true },
    });
    res.json(rows.map((r) => r.specialty));
  }),
);

/** Detalhe público de uma clínica (perfil + profissionais + serviços). */
publicRoutes.get(
  '/clinics/:slug',
  asyncHandler(async (req, res) => {
    const clinic = await resolveActiveClinic(req.params.slug);

    const [professionals, services] = await Promise.all([
      professionalsRepository.findAll(clinic.id),
      servicesRepository.findAll(clinic.id),
    ]);

    res.json({
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      description: clinic.description,
      logoUrl: clinic.logoUrl,
      phone: clinic.phone,
      email: clinic.email,
      address: clinic.address,
      city: clinic.city,
      state: clinic.state,
      zipCode: clinic.zipCode,
      specialties: clinic.specialties.map((s) => s.specialty),
      professionals: professionals.map((p) => ({ id: p.id, name: p.name, specialty: p.specialty })),
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        durationMinutes: s.durationMinutes,
        price: s.price,
      })),
    });
  }),
);

/** Profissionais da clínica (filtro opcional por especialidade). */
publicRoutes.get(
  '/clinics/:slug/professionals',
  asyncHandler(async (req, res) => {
    const clinic = await resolveActiveClinic(req.params.slug);
    const specialty = req.query.specialty as string | undefined;
    const professionals = await professionalsRepository.findAll(clinic.id, specialty);
    res.json(professionals.map((p) => ({ id: p.id, name: p.name, specialty: p.specialty })));
  }),
);

/** Serviços da clínica. */
publicRoutes.get(
  '/clinics/:slug/services',
  asyncHandler(async (req, res) => {
    const clinic = await resolveActiveClinic(req.params.slug);
    const services = await servicesRepository.findAll(clinic.id);
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

/** Horários livres para um profissional/serviço dentro da clínica. */
publicRoutes.get(
  '/clinics/:slug/availability',
  asyncHandler(async (req, res) => {
    const clinic = await resolveActiveClinic(req.params.slug);
    const { professionalId, serviceId, date } = req.query as Record<string, string | undefined>;
    if (!professionalId || !serviceId || !date) {
      throw new AppError('Informe professionalId, serviceId e date (YYYY-MM-DD)');
    }
    res.json(await appointmentsService.getAvailableSlots(clinic.id, professionalId, serviceId, date));
  }),
);

/** Agendamento online sem login, escopado por clínica. */
publicRoutes.post(
  '/clinics/:slug/appointments',
  validateBody(publicBookingSchema),
  asyncHandler(async (req, res) => {
    const clinic = await resolveActiveClinic(req.params.slug);
    const appointment = await appointmentsService.publicBooking(clinic.id, req.body);

    // Vincula o prontuário recém-criado a uma conta global existente (mesmo CPF)
    const account = await prisma.user.findUnique({ where: { cpf: appointment.patient.cpf } });
    if (account) {
      await prisma.patient.updateMany({
        where: { cpf: appointment.patient.cpf, userId: null },
        data: { userId: account.id },
      });
    }

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
