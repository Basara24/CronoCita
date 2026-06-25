import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AppError, UnauthorizedError } from '../../shared/errors/AppError';
import { authConfig } from '../../shared/utils/authConfig';
import { IAuthRepository, UserWithClinic } from './auth.repository';
import {
  AuthResultDTO,
  ForgotPasswordDTO,
  LoginDTO,
  RefreshTokenDTO,
  RegisterDTO,
  ResetPasswordDTO,
} from './auth.dtos';

export class AuthService {
  constructor(private readonly repository: IAuthRepository) {}

  private generateAccessToken(user: {
    id: string;
    role: string;
    name: string;
    clinicId: string | null;
  }): string {
    return jwt.sign(
      { role: user.role, name: user.name, clinicId: user.clinicId },
      authConfig.jwtSecret,
      {
        subject: user.id,
        expiresIn: authConfig.jwtExpiresIn as SignOptions['expiresIn'],
      },
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + authConfig.refreshExpiresInDays);
    await this.repository.saveRefreshToken({ token, userId, expiresAt });
    return token;
  }

  private async buildAuthResult(user: UserWithClinic): Promise<AuthResultDTO> {
    const clinicSlug = user.clinic?.slug ?? null;
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: await this.generateRefreshToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        clinicSlug,
        cpf: user.cpf,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async login({ email, password }: LoginDTO): Promise<AuthResultDTO> {
    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('E-mail ou senha incorretos');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('E-mail ou senha incorretos');
    }

    // Best-effort: vincula prontuários por CPF que ainda não tenham dono (contas antigas)
    if (user.role === 'PATIENT' && user.cpf) {
      await this.repository.linkPatientsByCpf(user.cpf, user.id);
    }

    return this.buildAuthResult(user);
  }

  async register({ name, email, cpf, phone, birthDate, password }: RegisterDTO): Promise<AuthResultDTO> {
    const existing = await this.repository.findUserByEmail(email);
    if (existing) {
      throw new AppError('E-mail já cadastrado', 409);
    }

    const existingCpf = await this.repository.findUserByCpf(cpf);
    if (existingCpf) {
      throw new AppError('CPF já cadastrado', 409);
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.repository.createUser({
      name,
      email,
      cpf,
      phone,
      password: hashed,
      role: 'PATIENT',
    });

    // Vincula registros Patient existentes (mesmo CPF) à nova conta global
    await this.repository.linkPatientsByCpf(cpf, user.id);

    // birthDate é capturado no cadastro; o registro Patient por clínica é criado no 1º agendamento
    void birthDate;

    return this.buildAuthResult(user);
  }

  /** Rotação de refresh token: o token usado é invalidado e um novo é emitido. */
  async refresh({ refreshToken }: RefreshTokenDTO): Promise<AuthResultDTO> {
    const stored = await this.repository.findRefreshToken(refreshToken);
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token inválido ou expirado');
    }

    await this.repository.deleteRefreshToken(stored.id);

    const user = await this.repository.findUserById(stored.userId);
    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado');
    }

    return this.buildAuthResult(user);
  }

  async forgotPassword({ email }: ForgotPasswordDTO): Promise<{ resetToken?: string }> {
    const user = await this.repository.findUserByEmail(email);
    // Resposta idêntica para e-mails inexistentes (evita enumeração de usuários)
    if (!user) {
      return {};
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await this.repository.savePasswordResetToken({ token, userId: user.id, expiresAt });

    // Em produção este token seria enviado por e-mail/WhatsApp.
    console.log(`[recuperação de senha] token para ${email}: ${token}`);
    return { resetToken: token };
  }

  async resetPassword({ token, password }: ResetPasswordDTO): Promise<void> {
    const stored = await this.repository.findPasswordResetToken(token);
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new AppError('Token de recuperação inválido ou expirado', 400);
    }

    const hashed = await bcrypt.hash(password, 10);
    await this.repository.updateUserPassword(stored.userId, hashed);
    await this.repository.markPasswordResetTokenUsed(stored.id);
  }
}
