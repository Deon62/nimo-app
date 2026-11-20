import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import type { PlanId } from '@/data/plans';
import type { BillingPeriod } from '@/state/AccountContext';
import { api } from './api';

type Status = { status: 'paid' | 'pending' | 'failed'; reason?: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Polls `check` until the payment settles. Throws when it fails or takes too long. */
async function settle(check: () => Promise<Status>, { every = 3000, tries = 30 } = {}): Promise<void> {
  for (let i = 0; i < tries; i++) {
    const res = await check();
    if (res.status === 'paid') return;
    if (res.status === 'failed') throw new Error(res.reason || 'The payment didn’t go through.');
    await wait(every);
  }
  throw new Error('Still waiting for the payment. If you were charged, your plan will update shortly.');
}

const verifyCard = (reference: string) => api<Status>(`/billing/paystack/verify/${reference}`);

/** Opens Paystack's page, then confirms with the API (the card is saved for next time). */
async function finishInBrowser(url: string, reference: string) {
  await WebBrowser.openAuthSessionAsync(url, Linking.createURL('payment-complete'));
  // Whether the browser was closed or redirected back, the API has the final word.
  const first = await verifyCard(reference);
  if (first.status === 'pending') {
    // Closed before paying: one short wait for a late webhook, then give up quietly.
    await settle(() => verifyCard(reference), { every: 2000, tries: 3 }).catch(() => {
      throw new Error('Payment not completed.');
    });
  } else if (first.status === 'failed') {
    throw new Error(first.reason || 'The payment didn’t go through.');
  }
}

export async function payWithNewCard(planId: PlanId, period: BillingPeriod) {
  const { authorization_url, reference } = await api<{ authorization_url: string; reference: string }>(
    '/billing/paystack/initialize',
    { method: 'POST', json: { plan_id: planId, period } },
  );
  await finishInBrowser(authorization_url, reference);
}

export async function payWithSavedCard(planId: PlanId, period: BillingPeriod, methodId: string) {
  const res = await api<{
    status: Status['status'] | 'action_required';
    reason?: string;
    authorization_url?: string;
    reference?: string;
  }>(
    '/billing/paystack/charge-saved',
    { method: 'POST', json: { plan_id: planId, period, method_id: methodId } },
  );
  if (res.status === 'paid') return;
  if (res.status === 'action_required' && res.authorization_url && res.reference) {
    await finishInBrowser(res.authorization_url, res.reference);
    return;
  }
  throw new Error(res.reason || 'The card was declined.');
}

/** Sends the M-Pesa PIN prompt, calls `onPrompt` with the KES amount, then waits for the PIN. */
export async function payWithMpesa(
  planId: PlanId,
  period: BillingPeriod,
  phone: string,
  onPrompt: (amountKes: number) => void,
) {
  const { checkout_request_id, amount_kes } = await api<{ checkout_request_id: string; amount_kes: number }>(
    '/billing/mpesa/stk-push',
    { method: 'POST', json: { plan_id: planId, period, phone } },
  );
  onPrompt(amount_kes);
  await wait(5000);
  await settle(() => api<Status>(`/billing/mpesa/status/${checkout_request_id}`), { every: 3000, tries: 30 });
}
