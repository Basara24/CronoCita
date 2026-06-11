import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../../../shared/database/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    service: { findUnique: jest.fn() },
    professional: { findUnique: jest.fn() },
    patient: { findUnique: jest.fn() },
    appointment: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    room: { findFirst: jest.fn() },
    equipment: { findFirst: jest.fn() },
    notification: { create: jest.fn(), update: jest.fn() },
  },
}));

import { prisma } from '../../../shared/database/prisma';
import { createApp } from '../../../app';

const app = createApp();
const mocked = prisma as unknown as {
  service: { findUnique: jest.Mock };
  professional: { findUnique: jest.Mock };
  patient: { findUnique: jest.Mock };
  appointment: { findMany: jest.Mock; create: jest.Mock };
  notification: { create: jest.Mock; update: jest.Mock };
};

const UUID = {
  patient: '11111111-1111-4111-8111-111111111111',
  professional: '22222222-2222-4222-8222-222222222222',
  service: '33333333-3333-4333-8333-333333333333',
};

function adminToken(): string {
  return jwt.sign({ role: 'ADMIN', name: 'Admin' }, 'cronocita-dev-secret', {
    subject: 'admin-id',
    expiresIn: '5m',
  });
}

function mockEntities() {
  mocked.service.findUnique.mockResolvedValue({
    id: UUID.service,
    name: 'Sessão de Fisioterapia',
    durationMinutes: 60,
    price: 200,
    requiresRoom: false,
    equipments: [],
  });
  mocked.professional.findUnique.mockResolvedValue({
    id: UUID.professional,
    name: 'Dra. Ana',
    specialty: 'Fisioterapia',
    commissionPercentage: 70,
  });
  mocked.patient.findUnique.mockResolvedValue({
    id: UUID.patient,
    name: 'João',
    phone: '(11) 90000-0000',
  });
}

describe('POST /api/appointments (integração)', () => {
  it('retorna 401 sem token de autenticação', async () => {
    const response = await request(app).post('/api/appointments').send({});
    expect(response.status).toBe(401);
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

  it('cria o agendamento (201) quando não há conflitos', async () => {
    mockEntities();
    mocked.appointment.findMany.mockResolvedValue([]);
    mocked.appointment.create.mockResolvedValue({
      id: 'novo-agendamento',
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
  });
});
