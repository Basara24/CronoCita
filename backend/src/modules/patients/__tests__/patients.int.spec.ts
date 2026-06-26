import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../../../shared/database/prisma', () => ({
  prisma: {
    patient: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '../../../shared/database/prisma';
import { createApp } from '../../../app';
import { authConfig } from '../../../shared/utils/authConfig';

const app = createApp();
const mocked = prisma as unknown as {
  patient: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const CLINIC_ID = 'clinic-aaaa';
const PATIENT_ID = '11111111-1111-4111-8111-111111111111';

const validPayload = {
  name: 'João Silva',
  cpf: '52998224725',
  email: 'joao@example.com',
  phone: '44999999999',
  birthDate: '1990-01-15',
};

function adminToken(clinicId: string | null = CLINIC_ID): string {
  return jwt.sign({ role: 'CLINIC_ADMIN', name: 'Admin', clinicId }, authConfig.jwtSecret, {
    subject: 'admin-id',
    expiresIn: '5m',
  });
}

function mockPatientRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: PATIENT_ID,
    clinicId: CLINIC_ID,
    userId: null,
    name: validPayload.name,
    cpf: validPayload.cpf,
    email: validPayload.email,
    phone: validPayload.phone,
    birthDate: new Date(validPayload.birthDate),
    address: null,
    city: null,
    state: null,
    zipCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CRUD /api/patients (integração)', () => {
  it('retorna 401 sem token', async () => {
    const response = await request(app).get('/api/patients');
    expect(response.status).toBe(401);
  });

  it('retorna 403 quando usuário não tem clínica', async () => {
    const response = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${adminToken(null)}`);
    expect(response.status).toBe(403);
  });

  it('retorna 400 para payload inválido', async () => {
    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'Jo' });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Erro de validação');
  });

  it('lista pacientes da clínica (200)', async () => {
    mocked.patient.findMany.mockResolvedValue([mockPatientRecord()]);

    const response = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(mocked.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ clinicId: CLINIC_ID }) }),
    );
  });

  it('busca paciente por id (200)', async () => {
    mocked.patient.findFirst.mockResolvedValue(mockPatientRecord());

    const response = await request(app)
      .get(`/api/patients/${PATIENT_ID}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(PATIENT_ID);
  });

  it('cria paciente (201)', async () => {
    mocked.patient.findFirst.mockResolvedValue(null);
    mocked.patient.create.mockResolvedValue(mockPatientRecord());

    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(PATIENT_ID);
    expect(mocked.patient.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ clinicId: CLINIC_ID, cpf: validPayload.cpf }),
      }),
    );
  });

  it('retorna 409 quando CPF já existe', async () => {
    mocked.patient.findFirst.mockResolvedValueOnce(mockPatientRecord());

    const response = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send(validPayload);

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('CPF já cadastrado');
    expect(mocked.patient.create).not.toHaveBeenCalled();
  });

  it('atualiza paciente (200)', async () => {
    mocked.patient.findFirst
      .mockResolvedValueOnce(mockPatientRecord())
      .mockResolvedValue(null);
    mocked.patient.update.mockResolvedValue(mockPatientRecord({ name: 'João Atualizado' }));

    const response = await request(app)
      .put(`/api/patients/${PATIENT_ID}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'João Atualizado' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('João Atualizado');
  });

  it('remove paciente (204)', async () => {
    mocked.patient.findFirst.mockResolvedValue(mockPatientRecord());
    mocked.patient.delete.mockResolvedValue(mockPatientRecord());

    const response = await request(app)
      .delete(`/api/patients/${PATIENT_ID}`)
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(204);
    expect(mocked.patient.delete).toHaveBeenCalledWith({ where: { id: PATIENT_ID } });
  });
});
