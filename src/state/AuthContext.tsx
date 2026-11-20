import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthMethod = 'email' | 'google' | 'apple' | 'phone';

interface Session {
  provider: AuthMethod;
  signedInAt: string;
}

interface AuthValue {
  /** False until the saved session has been read from storage. */
  ready: boolean;
  onboarded: boolean;
  session: Session | null;
  finishOnboarding: () => void;
  signIn: (provider: AuthMethod) => void;
  signOut: () => void;
}

const ONBOARDED_KEY = 'nimo.onboarded';
const SESSION_KEY = 'nimo.session';

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Mock auth: remembers onboarding and a signed-in session on the device.
 * Replace signIn with a real provider (e.g. Supabase / Firebase / Clerk) when the backend exists.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.multiGet([ONBOARDED_KEY, SESSION_KEY])
      .then(([[, seen], [, saved]]) => {
        if (!alive) return;
        setOnboarded(seen === '1');
        setSession(saved ? (JSON.parse(saved) as Session) : null);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const finishOnboarding = useCallback(() => {
    setOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
  }, []);

  const signIn = useCallback((provider: AuthMethod) => {
    const next = { provider, signedInAt: new Date().toISOString() };
    setOnboarded(true);
    setSession(next);
    AsyncStorage.multiSet([
      [ONBOARDED_KEY, '1'],
      [SESSION_KEY, JSON.stringify(next)],
    ]).catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ ready, onboarded, session, finishOnboarding, signIn, signOut }),
    [ready, onboarded, session, finishOnboarding, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
