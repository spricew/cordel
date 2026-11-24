'use client';

import { useActionState, useState } from 'react';

import { registerAction } from '@/actions/registerAction';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PrimaryInput } from '@/components/ui/PrimaryInput';
import type { RegisterActionState } from '@/types';

const initialState: RegisterActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <form action={formAction} className="relative flex flex-col gap-y-space-md w-115 z-100">
      <header>
        <span className="text-headline-lg">Crear cuenta</span>
        <p className="text-body-lg text-muted/90">
          Potencia la productividad de tu empresa ahora mismo
        </p>
      </header>

      <div className="flex flex-col gap-y-space-xs">
        <PrimaryInput
          label="Nombre"
          type="text"
          id="name"
          name="name"
          placeholder="@username"
          autoComplete="name"
          maxLength={100}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

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
          type="password"
          id="password"
          name="password"
          placeholder="********"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <PrimaryInput
          label="Confirmar contraseña"
          type="password"
          id="confirm-password"
          name="confirmPassword"
          placeholder="********"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      {state.message && (
        <p aria-live="polite" className="text-body-sm text-muted">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-y-3">
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Crear cuenta
        </Button>

        <ButtonLink href="/login" variant="ghost" size="lg" fullWidth>
          Ya tengo cuenta
        </ButtonLink>

        <p className="text-body-sm text-center text-muted">
          Al crear tu cuenta estás aceptando todos nuestros <a>Términos y condiciones</a>
        </p>
      </div>
    </form>
  );
}
