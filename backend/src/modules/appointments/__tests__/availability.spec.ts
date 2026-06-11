import { Appointment } from '@prisma/client';
import { AvailabilityChecker } from '../availability';
import { AvailabilityCheckDTO } from '../appointments.dtos';
import { ConflictError } from '../../../shared/errors/AppError';

function makeAppointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: 'appt-1',
    patientId: 'patient-1',
    professionalId: 'pro-1',
    serviceId: 'svc-1',
    roomId: 'room-1',
    equipmentId: 'eq-1',
    startsAt: new Date('2030-01-10T09:00:00'),
    endsAt: new Date('2030-01-10T10:00:00'),
    status: 'SCHEDULED',
    rating: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Appointment;
}

function makeChecker(conflicts: Appointment[]) {
  const repository = {
    findConflicts: jest.fn(async (_input: AvailabilityCheckDTO) => conflicts),
  };
  return { checker: new AvailabilityChecker(repository), repository };
}

const baseInput: AvailabilityCheckDTO = {
  professionalId: 'pro-1',
  roomId: 'room-1',
  equipmentId: 'eq-1',
  startsAt: new Date('2030-01-10T09:00:00'),
  endsAt: new Date('2030-01-10T10:00:00'),
};

describe('checkAvailability()', () => {
  it('permite agendar quando não há conflitos', async () => {
    const { checker } = makeChecker([]);
    await expect(checker.checkAvailability(baseInput)).resolves.toBeUndefined();
  });

  it('rejeita conflito de horário do profissional com "Horário indisponível."', async () => {
    const { checker } = makeChecker([makeAppointment({ professionalId: 'pro-1' })]);
    await expect(checker.checkAvailability(baseInput)).rejects.toThrow('Horário indisponível.');
  });

  it('rejeita sala já reservada com "Sala ou equipamento já reservado."', async () => {
    const { checker } = makeChecker([
      makeAppointment({ professionalId: 'outro-pro', roomId: 'room-1', equipmentId: null }),
    ]);
    await expect(checker.checkAvailability(baseInput)).rejects.toThrow(
      'Sala ou equipamento já reservado.',
    );
  });

  it('rejeita equipamento já reservado com "Sala ou equipamento já reservado."', async () => {
    const { checker } = makeChecker([
      makeAppointment({ professionalId: 'outro-pro', roomId: 'outra-sala', equipmentId: 'eq-1' }),
    ]);
    await expect(checker.checkAvailability(baseInput)).rejects.toThrow(
      'Sala ou equipamento já reservado.',
    );
  });

  it('lança ConflictError (HTTP 409) em qualquer conflito', async () => {
    const { checker } = makeChecker([makeAppointment({})]);
    await expect(checker.checkAvailability(baseInput)).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejeita intervalo inválido (fim antes do início)', async () => {
    const { checker } = makeChecker([]);
    await expect(
      checker.checkAvailability({
        ...baseInput,
        startsAt: new Date('2030-01-10T10:00:00'),
        endsAt: new Date('2030-01-10T09:00:00'),
      }),
    ).rejects.toThrow('Horário inválido: o término deve ser após o início.');
  });

  it('repassa o intervalo correto ao repositório', async () => {
    const { checker, repository } = makeChecker([]);
    await checker.checkAvailability(baseInput);
    expect(repository.findConflicts).toHaveBeenCalledWith(baseInput);
  });
});
