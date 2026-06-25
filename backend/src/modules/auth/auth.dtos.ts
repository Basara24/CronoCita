export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  password: string;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  password: string;
}

export interface AuthResultDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    clinicId: string | null;
    clinicSlug: string | null;
    cpf: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
}
