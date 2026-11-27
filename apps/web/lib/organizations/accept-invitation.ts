import type { AcceptedInvitation, Role } from '@cordel/types';

import type { AuthFetchResult } from '@/lib/api';
import type { AcceptInvitationState } from '@/types';

export const INVITATION_TOKEN_MAX_LENGTH = 256;

export type AuthFetchFn = (path: string, init?: RequestInit) => Promise<AuthFetchResult>;
export type RevalidateFn = (path: string) => void;

/* Normaliza el token que llega por enlace profundo (?token=...). No lo
 * valida del todo: el formulario y la API aplican las reglas finales. */
export function readInvitationTokenFromSearchParams(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().slice(0, INVITATION_TOKEN_MAX_LENGTH);
}

export function validateInvitationToken(rawToken: unknown): {
  token: string;
  error?: string;
} {
  const token = typeof rawToken === 'string' ? rawToken.trim() : '';

  if (token.length === 0) {
    return { token: '', error: 'El código de invitación es obligatorio' };
  }

  if (token.length > INVITATION_TOKEN_MAX_LENGTH || /\s/.test(token)) {
    return { token: '', error: 'El código de invitación no tiene un formato válido' };
  }

  return { token };
}

export async function executeAcceptInvitation(
  formData: FormData,
  deps: {
    fetchWithAuth: AuthFetchFn;
    revalidate: RevalidateFn;
  },
): Promise<AcceptInvitationState> {
  const { token, error } = validateInvitationToken(formData.get('token'));

  if (error !== undefined) {
    return {
      status: 'error',
      fieldErrors: { token: error },
    };
  }

  let result: AuthFetchResult;

  try {
    result = await deps.fetchWithAuth('/api/v1/me/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
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

  const { response } = result;

  if (response.status === 401) {
    return { status: 'error', message: 'Tu sesión expiró. Vuelve a iniciar sesión.' };
  }

  if (response.status === 400) {
    return {
      status: 'error',
      fieldErrors: { token: 'El código de invitación no es válido' },
    };
  }

  if (response.status === 404) {
    return {
      status: 'error',
      message:
        'No encontramos una invitación válida con ese código para tu correo actual. Verifica el código e inicia sesión con la cuenta invitada.',
    };
  }

  if (response.status === 429) {
    return {
      status: 'error',
      message: 'Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.',
    };
  }

  if (response.status === 403 || response.status === 409) {
    const serverMessage = await readSafeErrorMessage(response);
    return {
      status: 'error',
      message:
        serverMessage ??
        (response.status === 403
          ? 'No fue posible unirte a la organización por los límites del plan.'
          : 'La invitación ya no está disponible.'),
    };
  }

  if (!response.ok) {
    return {
      status: 'error',
      message: 'No pudimos aceptar la invitación. Intenta de nuevo.',
    };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return {
      status: 'error',
      message: 'El servidor devolvió una respuesta inesperada.',
    };
  }

  if (!isAcceptedInvitation(payload)) {
    return {
      status: 'error',
      message: 'El servidor devolvió una respuesta inesperada.',
    };
  }

  deps.revalidate('/organizations');
  deps.revalidate(`/organizations/${payload.organization.slug}`);

  return {
    status: 'success',
    organization: payload.organization,
    role: payload.role,
  };
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

function isRole(value: unknown): value is Role {
  return value === 'OWNER' || value === 'ADMIN' || value === 'MEMBER';
}

export function isAcceptedInvitation(value: unknown): value is AcceptedInvitation {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const org = candidate.organization;

  if (typeof org !== 'object' || org === null) {
    return false;
  }

  const orgCandidate = org as Record<string, unknown>;

  return (
    typeof candidate.userId === 'string' &&
    typeof candidate.organizationId === 'string' &&
    isRole(candidate.role) &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    typeof orgCandidate.id === 'string' &&
    typeof orgCandidate.name === 'string' &&
    typeof orgCandidate.slug === 'string' &&
    orgCandidate.slug !== ''
  );
}
