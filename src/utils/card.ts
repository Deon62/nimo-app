import type { CardBrand } from '@/state/AccountContext';

export const CARD_DIGITS = 16;

/** A number that passes the mock form, for trying the flow without a real card. */
export const TEST_CARD = { number: '4242 4242 4242 4242', expiry: '12/30', cvc: '123' };

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function detectBrand(number: string): CardBrand {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  return 'Card';
}

/** "4242424242424242" -> "4242 4242 4242 4242" (max 16 digits). */
export function formatCardNumber(value: string): string {
  return digitsOnly(value)
    .slice(0, CARD_DIGITS)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

/** "0828" -> "08/28" */
export function formatExpiry(value: string): string {
  const d = digitsOnly(value).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Mock cards are accepted: any 16 digits is valid until a payment provider verifies cards. */
export function isValidCardNumber(value: string): boolean {
  return digitsOnly(value).length === CARD_DIGITS;
}

export function isValidExpiry(value: string, now = new Date()): boolean {
  const d = digitsOnly(value);
  if (d.length !== 4) return false;
  const month = Number(d.slice(0, 2));
  const year = 2000 + Number(d.slice(2));
  if (month < 1 || month > 12) return false;
  return new Date(year, month, 1) > now;
}

export function isValidCvc(value: string): boolean {
  return digitsOnly(value).length === 3;
}
