import { cookies } from 'next/headers';

import { authFetch } from '@/lib/api';
import { SESSION_COOKIE } from '@/lib/auth/cookie';

/**
 * Cierra la sesión actual en los dos lados:
 * 1. Revoca el token en la API (si no, seguiría vivo en la base de datos).
 * 2. Borra la cookie httpOnly.
 *
 * No lanza si la API falla: salir de la sesión local nunca debe bloquearse.
 */
export async function endSession(): Promise<void> {
  try {
    await authFetch('/api/v1/auth/logout', { method: 'POST' });
  } catch {}

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
