import request from 'supertest';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import fs from 'node:fs';

jest.mock('../../../shared/database/prisma', () => ({
  prisma: {
    professional: { findUnique: jest.fn() },
    appointment: { findMany: jest.fn() },
    clinic: { findUnique: jest.fn(), update: jest.fn() },
    clinicPhoto: { findMany: jest.fn() },
    clinicSpecialty: { findMany: jest.fn() },
  },
}));

import { prisma } from '../../../shared/database/prisma';
import { createApp } from '../../../app';
import { authConfig } from '../../../shared/utils/authConfig';

const app = createApp();
const mocked = prisma as unknown as {
  professional: { findUnique: jest.Mock };
  appointment: { findMany: jest.Mock };
  clinic: { findUnique: jest.Mock; update: jest.Mock };
  clinicPhoto: { findMany: jest.Mock };
  clinicSpecialty: { findMany: jest.Mock };
};

const CLINIC_ID = 'clinic-aaaa';
const PRO_USER = 'pro-user-id';

function professionalToken(): string {
  return jwt.sign(
    { role: 'PROFESSIONAL', name: 'Dr. Ana', clinicId: CLINIC_ID },
    authConfig.jwtSecret,
    { subject: PRO_USER, expiresIn: '5m' },
  );
}

function adminToken(): string {
  return jwt.sign(
    { role: 'CLINIC_ADMIN', name: 'Admin', clinicId: CLINIC_ID },
    authConfig.jwtSecret,
    { subject: 'admin-id', expiresIn: '5m' },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mocked.professional.findUnique.mockResolvedValue({
    id: 'pro-id',
    userId: PRO_USER,
    clinicId: CLINIC_ID,
  });
});

describe('GET /api/professional/messaging/contacts', () => {
  it('exige autenticação (401)', async () => {
    const res = await request(app).get('/api/professional/messaging/contacts');
    expect(res.status).toBe(401);
  });

  it('retorna contatos elegíveis (200)', async () => {
    const future = new Date(Date.now() + 86_400_000);
    mocked.appointment.findMany.mockResolvedValue([
      {
        startsAt: future,
        status: 'SCHEDULED',
        patient: {
          userId: 'pat-user',
          name: 'João',
          user: { id: 'pat-user', name: 'João Silva', avatarUrl: null },
        },
      },
    ]);

    const res = await request(app)
      .get('/api/professional/messaging/contacts')
      .set('Authorization', `Bearer ${professionalToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].userId).toBe('pat-user');
    expect(res.body[0].name).toBe('João Silva');
  });
});

describe('POST /api/clinics/me/upload-logo', () => {
  const clinicRecord = {
    id: CLINIC_ID,
    name: 'Clínica Teste',
    slug: 'clinica-teste',
    logoUrl: null,
    coverImageUrl: null,
    specialties: [],
    photos: [],
  };

  it('persiste logoUrl no banco (201)', async () => {
    const pngPath = path.join(__dirname, 'fixtures', 'logo.png');
    fs.mkdirSync(path.dirname(pngPath), { recursive: true });
    // PNG mínimo válido (1x1)
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    fs.writeFileSync(pngPath, pngBuffer);

    mocked.clinic.update.mockResolvedValue({});
    mocked.clinic.findUnique.mockResolvedValue({ ...clinicRecord, logoUrl: '/uploads/clinic/test.png' });
    mocked.clinicSpecialty.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/clinics/me/upload-logo')
      .set('Authorization', `Bearer ${adminToken()}`)
      .attach('image', pngPath);

    expect(res.status).toBe(201);
    expect(mocked.clinic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CLINIC_ID },
        data: expect.objectContaining({ logoUrl: expect.stringContaining('/uploads/clinic/') }),
      }),
    );
    expect(res.body.logoUrl).toContain('/uploads/clinic/');

    fs.unlinkSync(pngPath);
  });
});
