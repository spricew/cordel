/**
 * Nombre de la cookie httpOnly donde Next guarda el token de sesión de la API.
 * Vive en su propio archivo para que `proxy.ts` pueda importarlo sin arrastrar
 * `next/headers` (que solo funciona dentro del render).
 */
export const SESSION_COOKIE = 'cordel_session';
