import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api, clearAuth, getStoredAuth, storeAuth, type StoredAuth } from './api';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): void;
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

  const signOut = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
