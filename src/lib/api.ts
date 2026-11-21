import { config } from './config';
import { supabase } from './supabase';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function messageFor(status: number, detail: unknown): string {
  if (typeof detail === 'string' && detail) return detail;
  if (status === 401) return 'Please log in again.';
  if (status >= 500) return 'Nimo is having trouble right now. Try again in a moment.';
  return 'Something went wrong.';
}

/** Calls the Nimo API with the signed-in user's token. Throws ApiError with a readable message. */
export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}${path}`, {
      ...rest,
      headers: {
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(await authHeader()),
        ...(headers as Record<string, string>),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch (e) {
    console.warn(`[api] ${rest.method ?? 'GET'} ${path} -> network error`, e);
    throw new ApiError('Can’t reach Nimo. Check your connection.', 0);
  }
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    // Shows up in the Metro terminal / device logs with the server's full error.
    console.warn(`[api] ${rest.method ?? 'GET'} ${path} -> ${res.status}`, body?.detail ?? body);
    throw new ApiError(messageFor(res.status, body?.detail), res.status);
  }
  return body as T;
}

export const apiUrl = (path: string) => `${config.apiUrl}${path}`;

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');
