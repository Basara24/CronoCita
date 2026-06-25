import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
    phone: z.string().min(8, 'Telefone inválido'),
    birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
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
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});
