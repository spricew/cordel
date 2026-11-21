import { cookies } from 'next/headers';

import { SESSION_COOKIE } from '@/lib/auth/cookie';

/**
 * Lee el token de la cookie httpOnly. Solo funciona en el servidor
 * (Server Components, Server Actions o Route Handlers).
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
