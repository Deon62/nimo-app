import { digitsOnly } from './card';

/** Mock exchange rate used to show M-Pesa amounts in shillings until real pricing exists. */
export const USD_TO_KES = 129;

export function toKes(usd: number): string {
  return `KES ${Math.round(usd * USD_TO_KES).toLocaleString('en-KE')}`;
}

/**
 * Normalises a Kenyan mobile number to 2547XXXXXXXX / 2541XXXXXXXX.
 * Accepts 0712…, 712…, +254712…, 254712…. Returns null when it isn't a valid Safaricom-style number.
 */
export function normaliseKenyanPhone(input: string): string | null {
  let d = digitsOnly(input);
  if (d.startsWith('254')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);
  return /^[17]\d{8}$/.test(d) ? `254${d}` : null;
}

/** 254712345678 -> "0712 ••• 678" */
export function maskPhone(phone: string): string {
  const local = `0${phone.slice(3)}`;
  return `${local.slice(0, 4)} ••• ${local.slice(-3)}`;
}

/** As-you-type display: "0712 345 678". */
export function formatKenyanPhone(input: string): string {
  const d = digitsOnly(input).slice(0, 12);
  if (d.startsWith('254')) return `+254 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`.trim();
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 10)].filter(Boolean).join(' ');
}
