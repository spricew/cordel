import { getSessionToken } from '@/lib/auth/session';

const API_URL = process.env.API_URL;
const REQUEST_TIMEOUT_MS = 10_000;

export type AuthFetchResult =
  | { readonly ok: true; readonly response: Response }
  | { readonly ok: false; readonly reason: 'no-session' | 'unavailable' };

export async function authFetch(path: string, init?: RequestInit): Promise<AuthFetchResult> {
  if (API_URL === undefined || API_URL === '') {
    throw new Error('Falta configurar API_URL en el servidor');
  }

  const token = await getSessionToken();

  if (token === undefined) {
    return { ok: false, reason: 'no-session' };
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return { ok: true, response };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
