import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';

import { supabaseConfigured } from '@/lib/config';
import { NOT_CONFIGURED_MESSAGE, supabase } from '@/lib/supabase';

export type OAuthProvider = 'google' | 'apple';

/** Result of email sign-up: signed in straight away, or waiting for the confirmation email. */
export type SignUpResult = 'signed-in' | 'confirm-email';

interface AuthValue {
  /** False until the saved session and onboarding flag have been read. */
  ready: boolean;
  onboarded: boolean;
  session: Session | null;
  finishOnboarding: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<SignUpResult>;
  sendPhoneCode: (phoneE164: string) => Promise<void>;
  verifyPhoneCode: (phoneE164: string, code: string) => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const ONBOARDED_KEY = 'nimo.onboarded';
const AuthContext = createContext<AuthValue | null>(null);

function ensureConfigured() {
  if (!supabaseConfigured) throw new Error(NOT_CONFIGURED_MESSAGE);
}

/** Supabase returns tokens in the URL fragment (implicit flow) or a `code` (PKCE). Handles both. */
export async function sessionFromRedirect(url: string) {
  const [, fragment = ''] = url.split('#');
  const query = url.includes('?') ? url.split('?')[1].split('#')[0] : '';
  const params = new URLSearchParams(fragment || query);
  const error = params.get('error_description') || params.get('error');
  if (error) throw new Error(error);
  const code = new URLSearchParams(query).get('code');
  if (code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) throw e;
    return;
  }
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) throw new Error('Sign-in was not completed.');
  const { error: e } = await supabase.auth.setSession({ access_token, refresh_token });
  if (e) throw e;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      AsyncStorage.getItem(ONBOARDED_KEY).catch(() => null),
      supabaseConfigured ? supabase.auth.getSession().then((r) => r.data.session) : Promise.resolve(null),
    ])
      .then(([seen, saved]) => {
        if (!alive) return;
        setOnboarded(seen === '1');
        setSession(saved);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));

    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const finishOnboarding = useCallback(() => {
    setOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, '1').catch(() => {});
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    ensureConfigured();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error)
      throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message);
  }, []);

  const signUpWithEmail = useCallback<AuthValue['signUpWithEmail']>(
    async ({ email, password, firstName, lastName }) => {
      ensureConfigured();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim() },
          emailRedirectTo: Linking.createURL('verify'),
        },
      });
      if (error) throw error;
      return data.session ? 'signed-in' : 'confirm-email';
    },
    [],
  );

  const sendPhoneCode = useCallback(async (phone: string) => {
    ensureConfigured();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
  }, []);

  const verifyPhoneCode = useCallback(async (phone: string, token: string) => {
    ensureConfigured();
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error)
      throw new Error(error.message.includes('expired') ? 'That code has expired. Send a new one.' : error.message);
  }, []);

  /** Opens Google / Apple in the browser and finishes sign-in. Resolves false if the user cancels. */
  const signInWithProvider = useCallback(async (provider: OAuthProvider) => {
    ensureConfigured();
    const redirectTo = Linking.createURL('verify');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url) throw error ?? new Error('Could not start sign-in.');
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') return false;
    await sessionFromRedirect(result.url);
    return true;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    ensureConfigured();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('verify'),
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      onboarded,
      session,
      finishOnboarding,
      signInWithEmail,
      signUpWithEmail,
      sendPhoneCode,
      verifyPhoneCode,
      signInWithProvider,
      resetPassword,
      signOut,
    }),
    [
      ready,
      onboarded,
      session,
      finishOnboarding,
      signInWithEmail,
      signUpWithEmail,
      sendPhoneCode,
      verifyPhoneCode,
      signInWithProvider,
      resetPassword,
      signOut,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
