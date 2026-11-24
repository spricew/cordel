'use server';

import { redirect } from 'next/navigation';
import type { RegisterActionState } from '@/types';
import { endSession } from '@/lib/auth/end-session';

const API_URL = process.env.API_URL;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MAX_NAME_LENGTH = 100;

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (name === '' || email === '' || password === '' || confirmPassword === '') {
    return { message: 'Completa todos los campos' };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { message: `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres` };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { message: `La contraseña no puede superar los ${MAX_PASSWORD_LENGTH} caracteres` };
  }

  if (password !== confirmPassword) {
    return { message: 'Las contraseñas no coinciden' };
  }

  if (!API_URL) {
    return { message: 'Falta configurar API_URL en el servidor' };
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { message: 'No pudimos conectar con el servidor. Intenta de nuevo.' };
  }

  if (response.status === 409) {
    return { message: 'Ese correo ya está registrado' };
  }

  if (response.status === 400) {
    return { message: 'Revisa el nombre, el correo y la contraseña' };
  }

  if (!response.ok) {
    return { message: 'No se pudo crear la cuenta. Intenta de nuevo.' };
  }

  await endSession();

  redirect('/login?registered=1');
}
