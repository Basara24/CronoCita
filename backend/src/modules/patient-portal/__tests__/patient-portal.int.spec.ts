import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../../../shared/database/prisma', () => ({
  prisma: {
    patient: { findMany: jest.fn() },
    appointment: { findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
    userNotification: { count: jest.fn(), findMany: jest.fn() },
    message: { findMany: jest.fn() },
    favorite: { count: jest.fn() },
  },
}));

import { prisma } from '../../../shared/database/prisma';
import { createApp } from '../../../app';
import { authConfig } from '../../../shared/utils/authConfig';

const app = createApp();
const mocked = prisma as unknown as {
  patient: { findMany: jest.Mock };
  appointment: { findMany: jest.Mock; findFirst: jest.Mock; count: jest.Mock };
  userNotification: { count: jest.Mock; findMany: jest.Mock };
};

function token(role: string): string {
  return jwt.sign({ role, name: 'Test' }, authConfig.jwtSecret, { subject: 'user-1', expiresIn: '5m' });
}

beforeEach(() => jest.clearAllMocks());

describe('GET /api/me/appointments (portal do paciente)', () => {
  it('exige autenticação (401)', async () => {
    const res = await request(app).get('/api/me/appointments');
    expect(res.status).toBe(401);
  });

  it('bloqueia usuários que não são PATIENT (403)', async () => {
    const res = await request(app)
      .get('/api/me/appointments')
      .set('Authorization', `Bearer ${token('CLINIC_ADMIN')}`);
    expect(res.status).toBe(403);
  });

  it('agrega agendamentos de todas as clínicas do paciente', async () => {
    // O paciente possui prontuários em duas clínicas distintas
    mocked.patient.findMany.mockResolvedValue([{ id: 'p-clinicaA' }, { id: 'p-clinicaB' }]);
    mocked.appointment.findMany.mockResolvedValue([
      { id: 'a1', clinic: { name: 'Clínica A' } },
      { id: 'a2', clinic: { name: 'Clínica B' } },
    ]);

    const res = await request(app)
      .get('/api/me/appointments?scope=upcoming')
      .set('Authorization', `Bearer ${token('PATIENT')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // A busca deve considerar os prontuários do usuário em todas as clínicas
    expect(mocked.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ patientId: { in: ['p-clinicaA', 'p-clinicaB'] } }),
      }),
    );
  });

  it('retorna o dashboard com métricas agregadas', async () => {
    mocked.patient.findMany
      .mockResolvedValueOnce([{ id: 'p-clinicaA' }, { id: 'p-clinicaB' }]) // patientIds
      .mockResolvedValueOnce([{ clinicId: 'A' }, { clinicId: 'B' }]); // clínicas visitadas
    mocked.appointment.findFirst.mockResolvedValue({ id: 'a1', clinic: { name: 'Clínica A' } });
    mocked.appointment.count.mockResolvedValue(3);
    mocked.userNotification.count.mockResolvedValue(2);
    (prisma as unknown as { favorite: { count: jest.Mock } }).favorite.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/me/dashboard')
      .set('Authorization', `Bearer ${token('PATIENT')}`);

    expect(res.status).toBe(200);
    expect(res.body.completedCount).toBe(3);
    expect(res.body.clinicsVisited).toBe(2);
    expect(res.body.unreadNotifications).toBe(2);
  });
});

describe('GET /api/messages/threads (chat)', () => {
  it('permite PATIENT e bloqueia SUPER_ADMIN (403)', async () => {
    mocked.appointment.findMany.mockResolvedValue([]);
    (prisma as unknown as { message: { findMany: jest.Mock } }).message.findMany.mockResolvedValue([]);

    const ok = await request(app)
      .get('/api/messages/threads')
      .set('Authorization', `Bearer ${token('PATIENT')}`);
    expect(ok.status).toBe(200);

    const blocked = await request(app)
      .get('/api/messages/threads')
      .set('Authorization', `Bearer ${token('SUPER_ADMIN')}`);
    expect(blocked.status).toBe(403);
  });
});
