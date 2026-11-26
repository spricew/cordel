'use server';

import { revalidatePath } from 'next/cache';

import { authFetch, type AuthFetchResult } from '@/lib/api';
import type { RevokeInvitationResult } from '@/types';

export async function revokeInvitationAction(
  orgSlug: string,
  invitationId: string,
): Promise<RevokeInvitationResult> {
  const normalizedSlug = orgSlug.trim().toLowerCase();

  if (normalizedSlug === '' || invitationId.trim() === '') {
    return { ok: false, message: 'Datos inválidos para revocar la invitación.' };
  }

  let result: AuthFetchResult;

  try {
    result = await authFetch(
      `/api/v1/organizations/${encodeURIComponent(normalizedSlug)}/invitations/${encodeURIComponent(invitationId)}`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, message: 'No pudimos preparar la solicitud. Intenta de nuevo.' };
  }

  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === 'no-session'
          ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
          : 'No pudimos conectar con el servidor. Intenta de nuevo.',
    };
  }

  if (result.response.status === 401) {
    return { ok: false, message: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
  }

  if (result.response.status === 403) {
    return { ok: false, message: 'No tienes permiso para revocar invitaciones.' };
  }

  if (result.response.status === 404) {
    return { ok: false, message: 'La invitación ya no existe.' };
  }

  if (result.response.status === 409) {
    return { ok: false, message: 'La invitación ya fue aceptada y no puede revocarse.' };
  }

  if (!result.response.ok) {
    return { ok: false, message: 'No pudimos revocar la invitación. Intenta de nuevo.' };
  }

  revalidatePath(`/organizations/${normalizedSlug}`);

  return { ok: true };
}
