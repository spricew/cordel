'use server';

import type { CreatedInvitation } from '@cordel/types';
import { revalidatePath } from 'next/cache';

import { authFetch, type AuthFetchResult } from '@/lib/api';
import type { CreateInvitationState } from '@/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createInvitationAction(
  _previousState: CreateInvitationState,
  formData: FormData,
): Promise<CreateInvitationState> {
  const orgSlug = String(formData.get('orgSlug') ?? '')
    .trim()
    .toLowerCase();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const roleValue = String(formData.get('role') ?? 'MEMBER').trim();

  if (orgSlug.length === 0) {
    return { status: 'error', message: 'No pudimos identificar la organización.' };
  }

  const fieldErrors: CreateInvitationState['fieldErrors'] = {};

  if (email.length === 0) {
    fieldErrors.email = 'El correo electrónico es obligatorio';
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = 'Ingresa un correo electrónico válido';
  }

  if (roleValue !== 'ADMIN' && roleValue !== 'MEMBER') {
    fieldErrors.role = 'El rol debe ser Administrador o Miembro';
  }

  if (fieldErrors.email !== undefined || fieldErrors.role !== undefined) {
    return { status: 'error', fieldErrors };
  }

  let result: AuthFetchResult;

  try {
    result = await authFetch(`/api/v1/organizations/${encodeURIComponent(orgSlug)}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: roleValue }),
    });
  } catch {
    return {
      status: 'error',
      message: 'No pudimos preparar la solicitud. Intenta de nuevo.',
    };
  }

  if (!result.ok) {
    return {
      status: 'error',
      message:
        result.reason === 'no-session'
          ? 'Tu sesión expiró. Vuelve a iniciar sesión.'
          : 'No pudimos conectar con el servidor. Intenta de nuevo.',
    };
  }

  if (result.response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
  }

  if (result.response.status === 403) {
    const serverMessage = await readErrorMessage(result.response);
    return {
      status: 'error',
      message:
        serverMessage ??
        'No tienes permiso para invitar o la organización alcanzó el límite de miembros.',
    };
  }

  if (result.response.status === 404) {
    return {
      status: 'error',
      message: 'No encontramos la organización solicitada.',
    };
  }

  if (result.response.status === 409) {
    const serverMessage = await readErrorMessage(result.response);
    return {
      status: 'error',
      fieldErrors: {
        email: serverMessage ?? 'Este correo ya es miembro o tiene una invitación pendiente',
      },
    };
  }

  if (!result.response.ok) {
    return {
      status: 'error',
      message: 'No pudimos enviar la invitación. Intenta de nuevo.',
    };
  }

  let payload: unknown;

  try {
    payload = await result.response.json();
  } catch {
    revalidatePath(`/organizations/${orgSlug}`);
    return { status: 'success' };
  }

  revalidatePath(`/organizations/${orgSlug}`);

  return {
    status: 'success',
    invitation: isCreatedInvitation(payload) ? payload : undefined,
  };
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const msg = (body as { message: unknown }).message;
      if (typeof msg === 'string' && msg.trim() !== '') {
        return msg;
      }
    }
  } catch {
    return null;
  }

  return null;
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
