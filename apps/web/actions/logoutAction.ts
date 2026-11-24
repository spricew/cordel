'use server';

import { redirect } from 'next/navigation';

import { endSession } from '@/lib/auth/end-session';

/** Cierra la sesión (API + cookie) y vuelve al login. */
export async function logoutAction(): Promise<void> {
  await endSession();

  // redirect() lanza NEXT_REDIRECT; debe quedar fuera de cualquier try/catch.
  redirect('/login');
}
