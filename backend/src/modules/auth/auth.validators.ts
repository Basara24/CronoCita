import { z } from 'zod';
import { zCpf, zNonEmptyString, zPhone } from '../../shared/validators/zodBr';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: zNonEmptyString('Senha é obrigatória'),
});

export const registerSchema = z
  .object({
    name: zNonEmptyString('Nome é obrigatório').min(3, 'Nome deve ter ao menos 3 caracteres'),
    email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
    cpf: zCpf(),
    phone: zPhone(),
    birthDate: zNonEmptyString('Data de nascimento é obrigatória'),
    password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme a senha'),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'É necessário aceitar os termos' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

export const refreshSchema = z.object({
  refreshToken: zNonEmptyString('Refresh token é obrigatório'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
});

export const resetPasswordSchema = z.object({
  token: zNonEmptyString('Token é obrigatório'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});
