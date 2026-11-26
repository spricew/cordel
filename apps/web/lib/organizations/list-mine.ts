import type { OrganizationOverview } from '@cordel/types';

import { authFetch } from '@/lib/api';

export type ListOrganizationsResult =
  | { readonly ok: true; readonly organizations: OrganizationOverview[] }
  | { readonly ok: false; readonly reason: 'unauthorized' | 'unavailable' | 'invalid-response' };

/**
 * Organizaciones a las que pertenece la sesión actual.
 *
 * La API resuelve la membresía con el token; aquí no se envía ningún id de
 * usuario u organización. Solo se ejecuta en el servidor.
 */
export async function listMineOrganizations(): Promise<ListOrganizationsResult> {
  const result = await authFetch('/api/v1/organizations');

  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason === 'no-session' ? 'unauthorized' : 'unavailable',
    };
  }

  if (result.response.status === 401) {
    return { ok: false, reason: 'unauthorized' };
  }

  if (!result.response.ok) {
    return { ok: false, reason: 'unavailable' };
  }

  let data: unknown;

  try {
    data = await result.response.json();
  } catch {
    return { ok: false, reason: 'invalid-response' };
  }

  if (!isOrganizationOverviewList(data)) {
    return { ok: false, reason: 'invalid-response' };
  }

  return { ok: true, organizations: data };
}

function isOrganizationOverviewList(value: unknown): value is OrganizationOverview[] {
  return Array.isArray(value) && value.every(isOrganizationOverview);
}

function isOrganizationOverview(value: unknown): value is OrganizationOverview {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.slug === 'string' &&
    typeof candidate.ownerId === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    (candidate.role === 'OWNER' || candidate.role === 'ADMIN' || candidate.role === 'MEMBER') &&
    typeof candidate.memberCount === 'number' &&
    typeof candidate.teamCount === 'number'
  );
}
