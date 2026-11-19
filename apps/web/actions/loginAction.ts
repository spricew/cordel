'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { LoginActionState } from '@/types';

const API_URL = process.env.API_URL;
const SESSION_COOKIE = 'cordel_session';

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (email === '' || password === '') {
    return { message: 'Faltan datos obligatorios' };
  }

  if (!API_URL) {
    return { message: 'Falta configurar API_URL en el servidor' };
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { message: 'No pudimos conectar con el servidor. Intenta de nuevo.' };
  }

  if (!response.ok) {
    return {
      message:
        response.status === 401
          ? 'Correo o contraseña incorrectos'
          : 'No se pudo iniciar sesión. Intenta de nuevo.',
    };
  }

  const data: unknown = await response.json();
  if (!isLoginResponse(data)) {
    return { message: 'El servidor devolvió una respuesta inesperada.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(data.expiresAt),
  });

  redirect('/organizations');
}

interface LoginResponse {
  token: string;
  expiresAt: string;
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.token === 'string' &&
    candidate.token !== '' &&
    typeof candidate.expiresAt === 'string' &&
    !Number.isNaN(Date.parse(candidate.expiresAt))
  );
}
