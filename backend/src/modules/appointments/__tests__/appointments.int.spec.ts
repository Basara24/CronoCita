import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../../../shared/database/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    service: { findFirst: jest.fn() },
    professional: { findFirst: jest.fn(), findUnique: jest.fn() },
    patient: { findFirst: jest.fn(), findUnique: jest.fn() },
    appointment: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    scheduleBlock: { count: jest.fn() },
    room: { findFirst: jest.fn() },
    equipment: { findFirst: jest.fn() },
    notification: { create: jest.fn(), update: jest.fn() },
  },
}));

import { prisma } from '../../../shared/database/prisma';
import { createApp } from '../../../app';
import { authConfig } from '../../../shared/utils/authConfig';

const app = createApp();
const mocked = prisma as unknown as {
  service: { findFirst: jest.Mock };
  professional: { findFirst: jest.Mock };
  patient: { findFirst: jest.Mock };
  appointment: { findMany: jest.Mock; create: jest.Mock };
  notification: { create: jest.Mock; update: jest.Mock };
};

const CLINIC_ID = 'clinic-aaaa';

const UUID = {
  patient: '11111111-1111-4111-8111-111111111111',
  professional: '22222222-2222-4222-8222-222222222222',
  service: '33333333-3333-4333-8333-333333333333',
};

function adminToken(clinicId: string | null = CLINIC_ID): string {
  return jwt.sign({ role: 'CLINIC_ADMIN', name: 'Admin', clinicId }, authConfig.jwtSecret, {
    subject: 'admin-id',
    expiresIn: '5m',
  });
}

function mockEntities() {
  mocked.service.findFirst.mockResolvedValue({
    id: UUID.service,
    clinicId: CLINIC_ID,
    name: 'Sessão de Fisioterapia',
    durationMinutes: 60,
    price: 200,
    requiresRoom: false,
    equipments: [],
  });
  mocked.professional.findFirst.mockResolvedValue({
    id: UUID.professional,
    clinicId: CLINIC_ID,
    name: 'Dra. Ana',
    specialty: 'Fisioterapia',
    commissionPercentage: 70,
  });
  mocked.patient.findFirst.mockResolvedValue({
    id: UUID.patient,
    clinicId: CLINIC_ID,
    name: 'João',
    phone: '(11) 90000-0000',
  });
  (prisma as unknown as { scheduleBlock: { count: jest.Mock } }).scheduleBlock.count.mockResolvedValue(0);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/appointments (integração multi-tenant)', () => {
  it('retorna 401 sem token de autenticação', async () => {
    const response = await request(app).post('/api/appointments').send({});
    expect(response.status).toBe(401);
  });

  it('retorna 403 quando o usuário não tem clínica associada', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken(null)}`)
      .send({
        patientId: UUID.patient,
        professionalId: UUID.professional,
        serviceId: UUID.service,
        startsAt: '2030-01-10T09:00:00.000Z',
      });

    expect(response.status).toBe(403);
  });

  it('retorna 400 para payload inválido', async () => {
    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ patientId: 'não-é-uuid' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Erro de validação');
  });

  it('retorna 409 quando há conflito de horário do profissional', async () => {
    mockEntities();
    mocked.appointment.findMany.mockResolvedValue([
      {
        id: 'conflito',
        clinicId: CLINIC_ID,
        professionalId: UUID.professional,
        roomId: null,
        equipmentId: null,
        startsAt: new Date('2030-01-10T09:00:00'),
        endsAt: new Date('2030-01-10T10:00:00'),
        status: 'SCHEDULED',
      },
    ]);

    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        patientId: UUID.patient,
        professionalId: UUID.professional,
        serviceId: UUID.service,
        startsAt: '2030-01-10T09:30:00.000Z',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Horário indisponível.');
    expect(mocked.appointment.create).not.toHaveBeenCalled();
  });

  it('cria o agendamento (201) escopado na clínica do usuário', async () => {
    mockEntities();
    mocked.appointment.findMany.mockResolvedValue([]);
    mocked.appointment.create.mockResolvedValue({
      id: 'novo-agendamento',
      clinicId: CLINIC_ID,
      status: 'SCHEDULED',
      startsAt: new Date('2030-01-10T09:00:00'),
      endsAt: new Date('2030-01-10T10:00:00'),
      patient: { name: 'João', phone: '(11) 90000-0000' },
      professional: { name: 'Dra. Ana' },
      service: { name: 'Sessão de Fisioterapia' },
      room: null,
      equipment: null,
    });
    mocked.notification.create.mockResolvedValue({ id: 'notif-1' });
    mocked.notification.update.mockResolvedValue({ id: 'notif-1' });

    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        patientId: UUID.patient,
        professionalId: UUID.professional,
        serviceId: UUID.service,
        startsAt: '2030-01-10T09:00:00.000Z',
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('novo-agendamento');
    expect(mocked.appointment.create).toHaveBeenCalledTimes(1);
    // O serviço deve ter buscado o recurso filtrando pela clínica do token
    expect(mocked.service.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clinicId: CLINIC_ID }) }),
    );
    // E gravado o agendamento com o clinicId correto
    expect(mocked.appointment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clinicId: CLINIC_ID }),
      }),
    );
  });

  it('isolamento: recurso de outra clínica não é encontrado (404)', async () => {
    // Simula que a busca escopada por clínica não retorna o serviço de outra clínica
    mocked.service.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({
        patientId: UUID.patient,
        professionalId: UUID.professional,
        serviceId: UUID.service,
        startsAt: '2030-01-10T09:00:00.000Z',
      });

    expect(response.status).toBe(404);
    expect(mocked.appointment.create).not.toHaveBeenCalled();
  });
});
