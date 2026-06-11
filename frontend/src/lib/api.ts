import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api';

const STORAGE_KEY = 'cronocita.auth';

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

export function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function storeAuth(auth: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<StoredAuth> | null = null;

async function refreshSession(refreshToken: string): Promise<StoredAuth> {
  const { data } = await axios.post<StoredAuth>(`${API_URL}/auth/refresh`, { refreshToken });
  storeAuth(data);
  return data;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const auth = getStoredAuth();

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      auth?.refreshToken &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshSession(auth.refreshToken);
        const renewed = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${renewed.accessToken}`;
        return api(original);
      } catch (refreshError) {
        refreshPromise = null;
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? 'Erro inesperado. Tente novamente.';
  }
  return 'Erro inesperado. Tente novamente.';
}
