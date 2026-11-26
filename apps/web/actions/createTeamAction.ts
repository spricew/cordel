'use server';

import { revalidatePath } from 'next/cache';

import { authFetch, type AuthFetchResult } from '@/lib/api';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
} from '@/lib/organizations/presentation';
import type { CreateTeamState } from '@/types';

export async function createTeamAction(
  _previousState: CreateTeamState,
  formData: FormData,
): Promise<CreateTeamState> {
  const orgSlug = String(formData.get('orgSlug') ?? '')
    .trim()
    .toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '')
    .trim()
    .toLowerCase();

  if (orgSlug.length === 0) {
    return { status: 'error', message: 'No pudimos identificar la organización.' };
  }

  const fieldErrors: CreateTeamState['fieldErrors'] = {};

  if (name.length < NAME_MIN_LENGTH) {
    fieldErrors.name = `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres`;
  } else if (name.length > NAME_MAX_LENGTH) {
    fieldErrors.name = `El nombre no puede superar los ${NAME_MAX_LENGTH} caracteres`;
  }

  if (slug.length === 0) {
    fieldErrors.slug = 'El identificador es obligatorio';
  } else if (slug.length > SLUG_MAX_LENGTH) {
    fieldErrors.slug = `El identificador no puede superar los ${SLUG_MAX_LENGTH} caracteres`;
  } else if (!SLUG_PATTERN.test(slug)) {
    fieldErrors.slug = 'No puede empezar ni terminar con guion, ni tener guiones seguidos';
  }

  if (fieldErrors.name !== undefined || fieldErrors.slug !== undefined) {
    return { status: 'error', fieldErrors };
  }

  let result: AuthFetchResult;

  try {
    result = await authFetch(`/api/v1/organizations/${encodeURIComponent(orgSlug)}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
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
    return {
      status: 'error',
      message: 'No tienes permiso para crear equipos en esta organización.',
    };
  }

  if (result.response.status === 404) {
    return {
      status: 'error',
      message: 'No encontramos la organización solicitada.',
    };
  }

  if (result.response.status === 409) {
    return {
      status: 'error',
      fieldErrors: { slug: 'Ya existe un equipo con este identificador' },
    };
  }

  if (!result.response.ok) {
    return {
      status: 'error',
      message: 'No pudimos crear el equipo. Intenta de nuevo.',
    };
  }

  revalidatePath(`/organizations/${orgSlug}`);
  revalidatePath('/organizations');

  return { status: 'success' };
}
