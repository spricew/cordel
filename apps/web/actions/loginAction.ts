'use server';

import type { LoginActionState } from '@/types';

const API_URL = process.env.API_URL;

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
    response = await fetch(`${API_URL}/auth/login`, {
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

  return { message: '' };
}
