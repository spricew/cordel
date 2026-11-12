'use server';

import type { LoginActionState } from '@/types';

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (email === '' || password === '') {
    return { message: 'Faltan datos obligatorios' };
  }

  return { message: `El servidor recibió el correo ${email}` };
}