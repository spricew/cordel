const DEFAULT_REDIRECT = '/organizations';
const DISALLOWED_PREFIXES = [
  '/login',
  '/register',
  '/session-expired',
  '/forgot-password',
  '/reset-password',
];

/**
 * Normaliza rutas de redirección post-login para evitar Open Redirect.
 * Solo acepta rutas relativas del mismo origen que inicien con `/`.
 */
export function sanitizeRedirectPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (typeof raw !== 'string') {
    return fallback;
  }

  const trimmed = raw.trim();
  if (trimmed === '' || !trimmed.startsWith('/')) {
    return fallback;
  }

  if (trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback;
  }

  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
    return fallback;
  }

  const pathname = trimmed.split('?')[0]?.split('#')[0] ?? '';
  if (
    DISALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return fallback;
  }

  return trimmed;
}
