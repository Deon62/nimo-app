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
const LAST_SEVEN = [7, 10, 4, 9, 6, 8, 5];

/** Minutes called over the last seven days, ending today. */
export function lastSevenDays(now: Date = new Date()): DailyUsage[] {
  return LAST_SEVEN.map((minutes, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (LAST_SEVEN.length - 1 - i));
    return { label: WEEKDAYS[date.getDay()], minutes, isToday: i === LAST_SEVEN.length - 1 };
  });
}

export const usage = {
  usedTodayMinutes: 5,
  dailyMinutes: 10,
  monthMinutes: 72,
  monthCalls: 23,
};

/** Monthly price as a number, e.g. 9.99. */
export function monthlyPrice(plan: Plan): number {
  return Number(plan.price.replace(/[^0-9.]/g, '')) || 0;
}

/** Yearly billing is discounted by this fraction. */
export const YEARLY_DISCOUNT = 0.2;

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
