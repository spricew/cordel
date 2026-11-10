'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PrimaryInput } from '@/components/ui/PrimaryInput';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      className="flex flex-col gap-y-space-sm"
      onSubmit={(event) => {
        // Aquí irá la Server Action
        event.preventDefault();
      }}
    >
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

      <button
        type="submit"
        className="w-full px-space-md py-space-sm rounded-full bg-action text-label-xl text-on-primary transition-colors hover:bg-action-hover"
      >
        Iniciar sesión
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
