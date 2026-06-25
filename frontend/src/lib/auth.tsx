import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api, clearAuth, getStoredAuth, storeAuth, type StoredAuth } from './api';
import { disconnectSocket } from './socket';
import type { AuthUser } from '@/types';

export interface RegisterPayload {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: true;
}

interface AuthContextValue {
  user: AuthUser | null;
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(payload: RegisterPayload): Promise<AuthUser>;
  signOut(): void;
  updateUser(patch: Partial<AuthUser>): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getStoredAuth();
    return stored ? (stored.user as AuthUser) : null;
  });

  const signIn = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<StoredAuth>('/auth/login', { email, password });
    storeAuth(data);
    setUser(data.user as AuthUser);
    return data.user as AuthUser;
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const { data } = await api.post<StoredAuth>('/auth/register', payload);
    storeAuth(data);
    setUser(data.user as AuthUser);
    return data.user as AuthUser;
  }, []);

  const signOut = useCallback(() => {
    clearAuth();
    disconnectSocket();
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      const stored = getStoredAuth();
      if (stored) storeAuth({ ...stored, user: { ...stored.user, ...patch } });
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signUp, signOut, updateUser }),
    [user, signIn, signUp, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
