import { cache } from 'react';
import type { UserSummary } from '@cordel/types';

import { authFetch } from '@/lib/api';

/**
 * Usuario de la sesión actual, o `null` si el token ya no sirve.
 * `cache()` memoriza el resultado durante un mismo request: si el layout
 * y la página lo piden, se hace un solo GET /auth/me.
 */
export const getCurrentUser = cache(async (): Promise<UserSummary | null> => {
  const result = await authFetch('/api/v1/auth/me');

  if (!result.ok) {
    if (result.reason === 'no-session') {
      return null;
    }

    throw new Error('No pudimos conectar con la API para validar la sesión');
  }

  if (result.response.status === 401) {
    return null;
  }

  if (!result.response.ok) {
    throw new Error(`La API respondió ${result.response.status} al validar la sesión`);
  }

  const data: unknown = await result.response.json();

  if (!isUserSummary(data)) {
    throw new Error('La API devolvió un usuario con una forma inesperada');
  }

  return data;
});

function isUserSummary(value: unknown): value is UserSummary {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    candidate.id !== '' &&
    typeof candidate.email === 'string' &&
    candidate.email !== '' &&
    typeof candidate.name === 'string'
  );
}
