export type PlanId = 'free' | 'plus' | 'pro';

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period?: string;
  /** Accent used for the plan's emblem and background waves. */
  color: string;
  features: PlanFeature[];
}

const feature = (label: string, included: boolean): PlanFeature => ({ label, included });

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    color: '#8E9AB4',
    features: [
      feature('10 minutes a day', true),
      feature('All AI contacts', true),
      feature('Priority connection', false),
      feature('Call recording', false),
      feature('Custom voices', false),
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$9.99',
    period: 'per month',
    color: '#5FA883',
    features: [
      feature('60 minutes a day', true),
      feature('All AI contacts', true),
      feature('Priority connection', true),
      feature('Call recording', true),
      feature('Custom voices', false),
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$24.99',
    period: 'per month',
    color: '#4F86D9',
    features: [
      feature('Unlimited minutes', true),
      feature('All AI contacts', true),
      feature('Priority connection', true),
      feature('Call recording', true),
      feature('Custom voices', true),
    ],
  },
];

export interface DailyUsage {
  /** Short weekday label, e.g. "Mon". */
  label: string;
  minutes: number;
  isToday: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Turns the API's `{date, minutes}` days (YYYY-MM-DD, oldest first) into chart bars. */
export function toDailyUsage(days: { date: string; minutes: number }[]): DailyUsage[] {
  return days.map((d, i) => ({
    label: WEEKDAYS[new Date(`${d.date}T12:00:00Z`).getUTCDay()],
    minutes: Math.round(d.minutes),
    isToday: i === days.length - 1,
  }));
}

/** Monthly price as a number, e.g. 9.99. */
export function monthlyPrice(plan: Plan): number {
  return Number(plan.price.replace(/[^0-9.]/g, '')) || 0;
}

/** Yearly billing is discounted by this fraction. */
export const YEARLY_DISCOUNT = 0.2;

const RANK: Record<PlanId, number> = { free: 0, plus: 1, pro: 2 };

/** A running paid plan can't be swapped for a lower one; it drops to Free when it expires. */
export function isDowngrade(target: PlanId, current: PlanId): boolean {
  return RANK[target] < RANK[current];
}

/** "12 Dec 2026" */
export function formatPlanDate(iso: string | null): string {
  if (!iso) return 'the end of your plan';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function priceFor(plan: Plan, period: 'monthly' | 'yearly'): number {
  const monthly = monthlyPrice(plan);
  return period === 'monthly' ? monthly : Math.round(monthly * 12 * (1 - YEARLY_DISCOUNT) * 100) / 100;
}

export function formatMoney(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getPlan(id: string | undefined): Plan | undefined {
  return plans.find((p) => p.id === id);
}
