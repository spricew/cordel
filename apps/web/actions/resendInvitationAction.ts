'use server';

import type { CreatedInvitation } from '@cordel/types';
import { revalidatePath } from 'next/cache';

import { authFetch, type AuthFetchResult } from '@/lib/api';
import type { ResendInvitationResult } from '@/types';

export async function resendInvitationAction(
  orgSlug: string,
  invitationId: string,
): Promise<ResendInvitationResult> {
  const normalizedSlug = orgSlug.trim().toLowerCase();

  if (normalizedSlug === '' || invitationId.trim() === '') {
    return { ok: false, message: 'Datos inválidos para reenviar la invitación.' };
  }

  let result: AuthFetchResult;

  try {
    result = await authFetch(
      `/api/v1/organizations/${encodeURIComponent(normalizedSlug)}/invitations/${encodeURIComponent(invitationId)}/resend`,
      { method: 'POST' },
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
    return { ok: false, message: 'No tienes permiso para reenviar invitaciones.' };
  }

  if (result.response.status === 404) {
    return { ok: false, message: 'La invitación ya no existe.' };
  }

  if (result.response.status === 409) {
    const serverMessage = await readSafeErrorMessage(result.response);
    return {
      ok: false,
      message: serverMessage ?? 'La invitación ya no puede reenviarse.',
    };
  }

  if (!result.response.ok) {
    return { ok: false, message: 'No pudimos reenviar la invitación. Intenta de nuevo.' };
  }

  let payload: unknown;

  try {
    payload = await result.response.json();
  } catch {
    return { ok: false, message: 'El servidor devolvió una respuesta inesperada.' };
  }

  if (!isCreatedInvitation(payload)) {
    return { ok: false, message: 'El servidor devolvió una respuesta inesperada.' };
  }

  revalidatePath(`/organizations/${normalizedSlug}`);

  return { ok: true, invitation: payload };
}

async function readSafeErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.trim() !== ''
    ) {
      return body.message;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function isCreatedInvitation(value: unknown): value is CreatedInvitation {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.organizationId === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.token === 'string' &&
    candidate.token !== '' &&
    (candidate.role === 'OWNER' || candidate.role === 'ADMIN' || candidate.role === 'MEMBER') &&
    (candidate.acceptedAt === null || typeof candidate.acceptedAt === 'string') &&
    (candidate.revokedAt === null || typeof candidate.revokedAt === 'string') &&
    typeof candidate.expiresAt === 'string' &&
    typeof candidate.sentAt === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}
