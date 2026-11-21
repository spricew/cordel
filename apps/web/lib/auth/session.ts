import { cookies } from 'next/headers';

/** Nombre de la cookie donde Next guarda el token de sesión de la API. */
export const SESSION_COOKIE = 'cordel_session';

/**
 * Lee el token de la cookie httpOnly. Solo funciona en el servidor
 * (Server Components, Server Actions o Route Handlers).
 */
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}
