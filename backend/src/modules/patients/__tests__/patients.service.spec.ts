import { Patient } from '@prisma/client';
import { PatientsService } from '../patients.service';
import { IPatientsRepository } from '../patients.repository';

const CLINIC_ID = 'clinic-aaaa';
const PATIENT_ID = 'patient-1111';

const createInput = {
  name: 'João Silva',
  cpf: '52998224725',
  email: 'joao@example.com',
  phone: '44999999999',
  birthDate: '1990-01-15',
};

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: PATIENT_ID,
    clinicId: CLINIC_ID,
    userId: null,
    name: createInput.name,
    cpf: createInput.cpf,
    email: createInput.email,
    phone: createInput.phone,
    birthDate: new Date(createInput.birthDate),
    address: null,
    city: null,
    state: null,
    zipCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Patient;
}

function makeRepository(): jest.Mocked<IPatientsRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCpf: jest.fn(),
    findByEmail: jest.fn(),
    findByUserId: jest.fn(),
    findAllByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe('PatientsService', () => {
  it('cria paciente quando CPF e e-mail são únicos', async () => {
    const repo = makeRepository();
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    repo.create.mockResolvedValue(makePatient());

    const service = new PatientsService(repo);
    const result = await service.create(CLINIC_ID, createInput);

    expect(repo.create).toHaveBeenCalledWith(CLINIC_ID, {
      ...createInput,
      birthDate: new Date(createInput.birthDate),
    });
    expect(result.id).toBe(PATIENT_ID);
  });

  it('rejeita CPF duplicado na criação (409)', async () => {
    const repo = makeRepository();
    repo.findByCpf.mockResolvedValue(makePatient());

    const service = new PatientsService(repo);
    await expect(service.create(CLINIC_ID, createInput)).rejects.toMatchObject({
      statusCode: 409,
      message: 'CPF já cadastrado',
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejeita e-mail duplicado na criação (409)', async () => {
    const repo = makeRepository();
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(makePatient());

    const service = new PatientsService(repo);
    await expect(service.create(CLINIC_ID, createInput)).rejects.toMatchObject({
      statusCode: 409,
      message: 'E-mail já cadastrado',
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejeita CPF de outro paciente na atualização (409)', async () => {
    const repo = makeRepository();
    repo.findById.mockResolvedValue(makePatient());
    repo.findByCpf.mockResolvedValue(makePatient({ id: 'outro-id' }));

    const service = new PatientsService(repo);
    await expect(
      service.update(CLINIC_ID, PATIENT_ID, { cpf: '39053344705' }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('retorna 404 quando paciente não existe', async () => {
    const repo = makeRepository();
    repo.findById.mockResolvedValue(null);

    const service = new PatientsService(repo);
    await expect(service.getById(CLINIC_ID, PATIENT_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('remove paciente existente', async () => {
    const repo = makeRepository();
    repo.findById.mockResolvedValue(makePatient());
    repo.delete.mockResolvedValue(undefined);

    const service = new PatientsService(repo);
    await service.delete(CLINIC_ID, PATIENT_ID);

    expect(repo.delete).toHaveBeenCalledWith(PATIENT_ID);
  });
});
