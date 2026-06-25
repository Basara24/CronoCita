import { AuthService } from '../auth.service';
import { IAuthRepository, UserWithClinic } from '../auth.repository';

function makeUser(overrides: Partial<UserWithClinic> = {}): UserWithClinic {
  return {
    id: 'user-1',
    name: 'João Pereira',
    email: 'joao@cliente.com',
    cpf: '111.111.111-11',
    phone: '(44) 90000-0000',
    avatarUrl: null,
    password: 'hashed',
    role: 'PATIENT',
    clinicId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    clinic: null,
    ...overrides,
  } as UserWithClinic;
}

function makeRepository(): jest.Mocked<IAuthRepository> {
  return {
    findUserByEmail: jest.fn(),
    findUserByCpf: jest.fn(),
    findUserById: jest.fn(),
    createUser: jest.fn(),
    linkPatientsByCpf: jest.fn(),
    saveRefreshToken: jest.fn(),
    findRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
    savePasswordResetToken: jest.fn(),
    findPasswordResetToken: jest.fn(),
    markPasswordResetTokenUsed: jest.fn(),
    updateUserPassword: jest.fn(),
  } as unknown as jest.Mocked<IAuthRepository>;
}

const registerInput = {
  name: 'João Pereira',
  email: 'joao@cliente.com',
  cpf: '111.111.111-11',
  phone: '(44) 90000-0000',
  birthDate: '1990-03-15',
  password: 'senha12345',
};

describe('AuthService.register (portal do paciente)', () => {
  it('cria a conta PATIENT e vincula prontuários por CPF', async () => {
    const repo = makeRepository();
    repo.findUserByEmail.mockResolvedValue(null);
    repo.findUserByCpf.mockResolvedValue(null);
    repo.createUser.mockResolvedValue(makeUser());
    repo.saveRefreshToken.mockResolvedValue({} as never);

    const service = new AuthService(repo);
    const result = await service.register(registerInput);

    expect(repo.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: registerInput.email, cpf: registerInput.cpf, role: 'PATIENT' }),
    );
    expect(repo.linkPatientsByCpf).toHaveBeenCalledWith(registerInput.cpf, 'user-1');
    expect(result.user.role).toBe('PATIENT');
    expect(result.accessToken).toBeDefined();
  });

  it('rejeita e-mail já cadastrado (409)', async () => {
    const repo = makeRepository();
    repo.findUserByEmail.mockResolvedValue(makeUser());

    const service = new AuthService(repo);
    await expect(service.register(registerInput)).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.createUser).not.toHaveBeenCalled();
  });

  it('rejeita CPF já cadastrado (409)', async () => {
    const repo = makeRepository();
    repo.findUserByEmail.mockResolvedValue(null);
    repo.findUserByCpf.mockResolvedValue(makeUser());

    const service = new AuthService(repo);
    await expect(service.register(registerInput)).rejects.toMatchObject({ statusCode: 409 });
    expect(repo.createUser).not.toHaveBeenCalled();
  });
});
