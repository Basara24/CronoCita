import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { validateBody } from '../../shared/middleware/validate';
import { AppError, NotFoundError } from '../../shared/errors/AppError';
import { prisma } from '../../shared/database/prisma';
import { ProfessionalsRepository } from '../professionals/professionals.repository';
import { ServicesRepository } from '../services/services.repository';
import { makeAppointmentsService } from './appointments.factory';
import { publicBookingSchema } from './appointments.validators';
import { contactsController } from '../contacts/contacts.controller';
import { createContactSchema } from '../contacts/contacts.validators';

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

/**
 * Lista clínicas ativas com filtros opcionais e busca inteligente.
 * `q` busca por nome/cidade/especialidade/serviço/profissional.
 */
publicRoutes.get(
  '/clinics',
  asyncHandler(async (req, res) => {
    const { name, city, specialty, q } = req.query as Record<string, string | undefined>;

    const filters: Prisma.ClinicWhereInput[] = [{ status: 'ACTIVE' }];
    if (name) filters.push({ name: { contains: name } });
    if (city) filters.push({ city: { contains: city } });
    if (specialty) filters.push({ specialties: { some: { specialty } } });

    if (q) {
      filters.push({
        OR: [
          { name: { contains: q } },
          { city: { contains: q } },
          { description: { contains: q } },
          { specialties: { some: { specialty: { contains: q } } } },
          { services: { some: { name: { contains: q } } } },
          { professionals: { some: { name: { contains: q } } } },
          { professionals: { some: { specialty: { contains: q } } } },
        ],
      });
    }

    const clinics = await prisma.clinic.findMany({
      where: { AND: filters },
      include: { specialties: true },
      orderBy: [{ rating: 'desc' }, { name: 'asc' }],
    });

    res.json(
      clinics.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        city: c.city,
        state: c.state,
        logoUrl: c.logoUrl,
        coverImageUrl: c.coverImageUrl,
        rating: c.rating,
        description: c.description,
        specialties: c.specialties.map((s) => s.specialty),
      })),
    );
  }),
);

/** Clínicas em destaque: populares (mais agendamentos), melhor avaliadas e recentes. */
publicRoutes.get(
  '/clinics/featured',
  asyncHandler(async (req, res) => {
    const city = req.query.city as string | undefined;

    const mapClinic = (c: {
      id: string;
      name: string;
      slug: string;
      city: string;
      state: string;
      logoUrl: string | null;
      coverImageUrl: string | null;
      rating: Prisma.Decimal | null;
      specialties: { specialty: string }[];
    }) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      city: c.city,
      state: c.state,
      logoUrl: c.logoUrl,
      coverImageUrl: c.coverImageUrl,
      rating: c.rating,
      specialties: c.specialties.map((s) => s.specialty),
    });

    const select = {
      id: true,
      name: true,
      slug: true,
      city: true,
      state: true,
      logoUrl: true,
      coverImageUrl: true,
      rating: true,
      specialties: { select: { specialty: true } },
    } as const;

    const [popularGroups, topRated, nearby] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['clinicId'],
        _count: { clinicId: true },
        orderBy: { _count: { clinicId: 'desc' } },
        take: 6,
      }),
      prisma.clinic.findMany({
        where: { status: 'ACTIVE', rating: { not: null } },
        orderBy: { rating: 'desc' },
        take: 6,
        select,
      }),
      prisma.clinic.findMany({
        where: { status: 'ACTIVE', ...(city ? { city: { contains: city } } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select,
      }),
    ]);

    const popularIds = popularGroups.map((g) => g.clinicId);
    const popularClinics = popularIds.length
      ? await prisma.clinic.findMany({
          where: { id: { in: popularIds }, status: 'ACTIVE' },
          select,
        })
      : [];
    const popular = popularIds
      .map((id) => popularClinics.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    res.json({
      popular: popular.map(mapClinic),
      topRated: topRated.map(mapClinic),
      nearby: nearby.map(mapClinic),
    });
  }),
);

/** Fale Conosco — recebe mensagens de contato do site público. */
publicRoutes.post(
  '/contact',
  validateBody(createContactSchema),
  asyncHandler(contactsController.create),
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

    const [professionals, services, photos] = await Promise.all([
      professionalsRepository.findAll(clinic.id),
      servicesRepository.findAll(clinic.id),
      prisma.clinicPhoto.findMany({ where: { clinicId: clinic.id }, orderBy: { createdAt: 'asc' } }),
    ]);

    res.json({
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      description: clinic.description,
      logoUrl: clinic.logoUrl,
      coverImageUrl: clinic.coverImageUrl,
      website: clinic.website,
      instagram: clinic.instagram,
      facebook: clinic.facebook,
      phone: clinic.phone,
      email: clinic.email,
      address: clinic.address,
      city: clinic.city,
      state: clinic.state,
      zipCode: clinic.zipCode,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      rating: clinic.rating,
      specialties: clinic.specialties.map((s) => s.specialty),
      photos: photos.map((p) => ({ id: p.id, url: p.url, category: p.category, caption: p.caption })),
      professionals: professionals.map((p) => ({ id: p.id, name: p.name, specialty: p.specialty })),
      services: services
        .filter((s) => s.status === 'ACTIVE')
        .map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          price: s.price,
          imageUrl: s.imageUrl,
          professionalId: s.professionalId,
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
