import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { File } from 'expo-file-system';

import type { PlanId } from '@/data/plans';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { maskPhone } from '@/utils/mpesa';
import { useAuth } from './AuthContext';

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Public URL of the uploaded photo, or null. */
  avatarUri: string | null;
}

/** Card saved by Paystack after a card payment. Only display details reach the app. */
export interface CardMethod {
  id: string;
  kind: 'card';
  brand: string;
  last4: string;
  expiry: string;
}

/** M-Pesa number that receives the PIN prompt (STK push). */
export interface MpesaMethod {
  id: string;
  kind: 'mpesa';
  /** 2547XXXXXXXX */
  phone: string;
}

export type PaymentMethod = CardMethod | MpesaMethod;
export type BillingPeriod = 'monthly' | 'yearly';

interface ApiMethod {
  id: string;
  kind: 'card' | 'mpesa';
  brand?: string;
  last4?: string;
  expiry?: string;
  phone?: string;
  is_default: boolean;
}

interface AccountValue {
  /** True until the first load after sign-in finishes. */
  loading: boolean;
  profile: Profile;
  updateProfile: (changes: Partial<Omit<Profile, 'avatarUri'>>) => Promise<void>;
  setAvatar: (localUri: string | null) => Promise<void>;

  planId: PlanId;
  billingPeriod: BillingPeriod | null;
  /** ISO date the paid plan runs until. */
  planEndsAt: string | null;
  canRecordCalls: boolean;

  paymentMethods: PaymentMethod[];
  defaultPaymentId: string | null;
  addMpesaNumber: (phone: string) => Promise<PaymentMethod>;
  removePaymentMethod: (id: string) => Promise<void>;
  setDefaultPayment: (id: string) => Promise<void>;

  /** Reloads plan and payment methods (after a payment, for example). */
  refresh: () => Promise<void>;
}

const EMPTY_PROFILE: Profile = { firstName: '', lastName: '', email: '', phone: '', avatarUri: null };
const AccountContext = createContext<AccountValue | null>(null);

function toMethod(m: ApiMethod): PaymentMethod {
  return m.kind === 'mpesa'
    ? { id: m.id, kind: 'mpesa', phone: m.phone ?? '' }
    : { id: m.id, kind: 'card', brand: m.brand ?? 'Card', last4: m.last4 ?? '', expiry: m.expiry ?? '' };
}

/** Profile from Supabase; plan, usage and payment methods from the Nimo API. */
export function AccountProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [planId, setPlanId] = useState<PlanId>('free');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod | null>(null);
  const [planEndsAt, setPlanEndsAt] = useState<string | null>(null);
  const [methods, setMethods] = useState<ApiMethod[]>([]);

  const loadProfile = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('profiles')
      .select('first_name,last_name,phone,avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();
    const meta = session.user.user_metadata ?? {};
    const [metaFirst = '', ...metaRest] = String(meta.full_name ?? meta.name ?? '').split(' ');
    setProfile({
      firstName: data?.first_name ?? meta.first_name ?? metaFirst,
      lastName: data?.last_name ?? meta.last_name ?? metaRest.join(' '),
      email: session.user.email ?? '',
      phone: data?.phone ?? session.user.phone ?? '',
      avatarUri: data?.avatar_url ?? meta.avatar_url ?? null,
    });
  }, [session]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const [plan, list] = await Promise.all([
      api<{ plan_id: PlanId; period: BillingPeriod | null; current_period_end: string | null }>('/billing/me'),
      api<ApiMethod[]>('/billing/payment-methods'),
    ]);
    setPlanId(plan.plan_id);
    setBillingPeriod(plan.period);
    setPlanEndsAt(plan.plan_id === 'free' ? null : plan.current_period_end);
    setMethods(list);
  }, [session]);

  // A different user (or signed out): drop the old user's data straight away.
  const [loadedFor, setLoadedFor] = useState(userId);
  if (loadedFor !== userId) {
    setLoadedFor(userId);
    setProfile(EMPTY_PROFILE);
    setPlanId('free');
    setBillingPeriod(null);
    setPlanEndsAt(null);
    setMethods([]);
    setLoading(true);
  }

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    // Started from a promise so no state is set during the effect itself.
    Promise.resolve()
      .then(() => Promise.allSettled([loadProfile(), refresh()]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // Reload only when the signed-in user changes, not on every token refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const updateProfile = useCallback<AccountValue['updateProfile']>(
    async (changes) => {
      if (!session) return;
      const row: Record<string, string> = {};
      if (changes.firstName !== undefined) row.first_name = changes.firstName;
      if (changes.lastName !== undefined) row.last_name = changes.lastName;
      if (changes.phone !== undefined) row.phone = changes.phone;
      if (Object.keys(row).length) {
        const { error } = await supabase.from('profiles').update(row).eq('id', session.user.id);
        if (error) throw error;
      }
      if (changes.email && changes.email !== session.user.email) {
        // Supabase emails a confirmation link to the new address before switching.
        const { error } = await supabase.auth.updateUser({ email: changes.email });
        if (error) throw error;
      }
      setProfile((prev) => ({ ...prev, ...changes, email: session.user.email ?? prev.email }));
    },
    [session],
  );

  const setAvatar = useCallback(
    async (localUri: string | null) => {
      if (!session) return;
      let url: string | null = null;
      if (localUri) {
        const ext = /\.(png|webp|heic|heif)$/i.exec(localUri)?.[1]?.toLowerCase() ?? 'jpg';
        const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        // On native, read the picked file directly; Expo's fetch doesn't load file:// URIs.
        const bytes =
          Platform.OS === 'web' ? await (await fetch(localUri)).arrayBuffer() : await new File(localUri).bytes();
        const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
        // A new path each time, so no upsert: upsert also needs a read policy the avatars bucket doesn't have.
        const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType });
        if (error) {
          console.warn('[avatar] upload failed', error);
          throw new Error('Couldn’t upload your photo. Try again.');
        }
        url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id);
      if (error) throw error;
      setProfile((prev) => ({ ...prev, avatarUri: url }));
    },
    [session],
  );

  const addMpesaNumber = useCallback(async (phone: string) => {
    const created = await api<ApiMethod>('/billing/payment-methods/mpesa', { method: 'POST', json: { phone } });
    setMethods((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
    return toMethod(created);
  }, []);

  const removePaymentMethod = useCallback(
    async (id: string) => {
      await api(`/billing/payment-methods/${id}`, { method: 'DELETE' });
      await refresh();
    },
    [refresh],
  );

  const setDefaultPayment = useCallback(async (id: string) => {
    await api(`/billing/payment-methods/${id}/default`, { method: 'POST' });
    setMethods((prev) => prev.map((m) => ({ ...m, is_default: m.id === id })));
  }, []);

  const value = useMemo<AccountValue>(
    () => ({
      loading,
      profile,
      updateProfile,
      setAvatar,
      planId,
      billingPeriod,
      planEndsAt,
      canRecordCalls: planId !== 'free',
      paymentMethods: methods.map(toMethod),
      defaultPaymentId: methods.find((m) => m.is_default)?.id ?? methods[0]?.id ?? null,
      addMpesaNumber,
      removePaymentMethod,
      setDefaultPayment,
      refresh,
    }),
    [
      loading,
      profile,
      updateProfile,
      setAvatar,
      planId,
      billingPeriod,
      planEndsAt,
      methods,
      addMpesaNumber,
      removePaymentMethod,
      setDefaultPayment,
      refresh,
    ],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used inside AccountProvider');
  return ctx;
}

/** "Visa •••• 4242" or "M-Pesa 0712 ••• 678". */
export function methodLabel(method: PaymentMethod): string {
  if (method.kind === 'mpesa') return `M-Pesa ${maskPhone(method.phone)}`;
  return `${method.brand} •••• ${method.last4}`;
}

/** Secondary line: card expiry, or the payment type for M-Pesa. */
export function methodDetail(method: PaymentMethod): string {
  return method.kind === 'card' ? (method.expiry ? `Expires ${method.expiry}` : 'Card') : 'Mobile money';
}
