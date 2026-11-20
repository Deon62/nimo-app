import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { PlanId } from '@/data/plans';
import { currentUser } from '@/data/user';
import { maskPhone } from '@/utils/mpesa';

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Local image URI picked by the user; replaced by an uploaded URL once the backend exists. */
  avatarUri: string | null;
}

export type CardBrand = 'Visa' | 'Mastercard' | 'Card';

/** Only display details are kept. Full card numbers never live in app state. */
export interface CardMethod {
  id: string;
  kind: 'card';
  brand: CardBrand;
  last4: string;
  expiry: string;
  holder: string;
}

/** M-Pesa mobile money. The number receives the STK push (PIN prompt) when paying. */
export interface MpesaMethod {
  id: string;
  kind: 'mpesa';
  /** International format without "+", e.g. 254712345678. */
  phone: string;
}

export type PaymentMethod = CardMethod | MpesaMethod;
type NewPaymentMethod = Omit<CardMethod, 'id'> | Omit<MpesaMethod, 'id'>;

export type BillingPeriod = 'monthly' | 'yearly';

interface AccountValue {
  profile: Profile;
  updateProfile: (changes: Partial<Profile>) => void;

  planId: PlanId;
  billingPeriod: BillingPeriod;
  subscribe: (planId: PlanId, period: BillingPeriod) => void;
  canRecordCalls: boolean;

  paymentMethods: PaymentMethod[];
  defaultPaymentId: string | null;
  addPaymentMethod: (method: NewPaymentMethod) => PaymentMethod;
  removePaymentMethod: (id: string) => void;
  setDefaultPayment: (id: string) => void;
}

const AccountContext = createContext<AccountValue | null>(null);

/**
 * In-memory account state: profile, subscription and saved cards.
 * Swap the setters for API calls (and a payment provider such as Stripe) later.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
    phone: currentUser.phone,
    avatarUri: null,
  });
  const [planId, setPlanId] = useState<PlanId>('free');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultPaymentId, setDefaultPaymentId] = useState<string | null>(null);

  const updateProfile = useCallback((changes: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...changes }));
  }, []);

  const subscribe = useCallback((next: PlanId, period: BillingPeriod) => {
    setPlanId(next);
    setBillingPeriod(period);
  }, []);

  const addPaymentMethod = useCallback((method: NewPaymentMethod) => {
    const created = { ...method, id: `pm-${Date.now()}` } as PaymentMethod;
    setPaymentMethods((prev) => [...prev, created]);
    setDefaultPaymentId((prev) => prev ?? created.id);
    return created;
  }, []);

  const removePaymentMethod = useCallback((id: string) => {
    setPaymentMethods((prev) => {
      const next = prev.filter((m) => m.id !== id);
      setDefaultPaymentId((current) => (current === id ? (next[0]?.id ?? null) : current));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      planId,
      billingPeriod,
      subscribe,
      canRecordCalls: planId !== 'free',
      paymentMethods,
      defaultPaymentId,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPayment: setDefaultPaymentId,
    }),
    [
      profile,
      updateProfile,
      planId,
      billingPeriod,
      subscribe,
      paymentMethods,
      defaultPaymentId,
      addPaymentMethod,
      removePaymentMethod,
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
  return method.kind === 'card' ? `Expires ${method.expiry}` : 'Mobile money';
}
