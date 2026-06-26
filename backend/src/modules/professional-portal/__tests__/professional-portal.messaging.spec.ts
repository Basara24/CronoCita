jest.mock('../../../shared/database/prisma', () => ({
  prisma: {
    professional: { findUnique: jest.fn() },
    appointment: { count: jest.fn(), findMany: jest.fn() },
  },
}));

import { prisma } from '../../../shared/database/prisma';
import { ProfessionalPortalService } from '../professional-portal.service';

const mocked = prisma as unknown as {
  professional: { findUnique: jest.Mock };
  appointment: { count: jest.Mock; findMany: jest.Mock };
};

const service = new ProfessionalPortalService();
const PRO_USER = 'pro-user-id';
const PAT_USER = 'pat-user-id';
const PRO_ID = 'pro-id';

beforeEach(() => {
  jest.clearAllMocks();
  mocked.professional.findUnique.mockResolvedValue({ id: PRO_ID, userId: PRO_USER, clinicId: 'clinic-1' });
});

describe('ProfessionalPortalService — mensagens', () => {
  describe('hasPatientLink', () => {
    it('retorna true quando há consulta não cancelada', async () => {
      mocked.appointment.count.mockResolvedValue(1);
      await expect(service.hasPatientLink(PRO_USER, PAT_USER)).resolves.toBe(true);
      expect(mocked.appointment.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            professionalId: PRO_ID,
            status: { not: 'CANCELED' },
            patient: { userId: PAT_USER },
          }),
        }),
      );
    });

    it('retorna false sem vínculo', async () => {
      mocked.appointment.count.mockResolvedValue(0);
      await expect(service.hasPatientLink(PRO_USER, PAT_USER)).resolves.toBe(false);
    });
  });

  describe('listMessagingContacts', () => {
    it('agrupa pacientes com próxima consulta e último atendimento', async () => {
      const future = new Date(Date.now() + 86_400_000);
      const past = new Date(Date.now() - 86_400_000);

      mocked.appointment.findMany.mockResolvedValue([
        {
          startsAt: future,
          status: 'CONFIRMED',
          patient: {
            userId: PAT_USER,
            name: 'Maria',
            user: { id: PAT_USER, name: 'Maria', avatarUrl: null },
          },
        },
        {
          startsAt: past,
          status: 'FINISHED',
          patient: {
            userId: PAT_USER,
            name: 'Maria',
            user: { id: PAT_USER, name: 'Maria', avatarUrl: null },
          },
        },
      ]);

      const contacts = await service.listMessagingContacts(PRO_USER);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].userId).toBe(PAT_USER);
      expect(contacts[0].nextAppointment).toEqual(future);
      expect(contacts[0].lastAttendance).toEqual(past);
    });

    it('filtra por nome na busca', async () => {
      mocked.appointment.findMany.mockResolvedValue([
        {
          startsAt: new Date(),
          status: 'SCHEDULED',
          patient: {
            userId: 'u1',
            name: 'Ana',
            user: { id: 'u1', name: 'Ana', avatarUrl: null },
          },
        },
        {
          startsAt: new Date(),
          status: 'SCHEDULED',
          patient: {
            userId: 'u2',
            name: 'Bruno',
            user: { id: 'u2', name: 'Bruno', avatarUrl: null },
          },
        },
      ]);

      const contacts = await service.listMessagingContacts(PRO_USER, 'ana');
      expect(contacts).toHaveLength(1);
      expect(contacts[0].name).toBe('Ana');
    });
  });
});
