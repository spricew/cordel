'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { PrimaryInput } from '@/components/ui/PrimaryInput';
import { loginAction } from '@/actions/loginAction';
import type { LoginActionState } from '@/types';

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form action={formAction} className="flex flex-col gap-y-space-sm">
      <PrimaryInput
        label="Correo electrónico"
        type="email"
        id="email"
        name="email"
        placeholder="example@email.com"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <PrimaryInput
        label="Contraseña"
        labelAction={
          <Link
            href="/forgot-password"
            className="text-label-md text-action underline-offset-4 transition-colors hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        }
        type="password"
        id="password"
        name="password"
        placeholder="********"
        autoComplete="current-password"
        minLength={8}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {state.message && (
        <p aria-live="polite" className="text-body-sm text-muted">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-space-md py-space-sm rounded-full bg-action text-label-xl text-on-primary transition-colors hover:bg-action-hover"
      >
        {pending ? 'Entrando…' : 'Iniciar sesión'}
      </button>
      <p className="text-body-sm text-center text-muted">
        ¿No tienes cuenta?{' '}
        <Link
          href="/register"
          className="text-label-md text-action underline-offset-4 transition-colors hover:underline"
        >
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
