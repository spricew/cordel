import { IconMail } from '@tabler/icons-react';
import Link from 'next/link';

import { Button } from '@components/ui/Button';
import { PrimaryInput } from '@/components/ui/PrimaryInput';

export default function ForgotPassword() {
  return (
    <div className="flex flex-col w-full h-screen">
      <section className="flex w-full flex-1 p-space-md pt-0">
        <div className="flex flex-col justify-center items-center w-full h-full rounded-xl bg-white border border-border">
          <div className="flex flex-col max-w-115 gap-y-space-md rise-in">
            <header className="flex flex-col gap-y-space-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
                <IconMail aria-hidden="true" className="h-6 w-6" stroke={1.5} />
              </span>
              <h1 className="text-headline-lg text-primary">¿Olvidaste tu contraseña?</h1>
              <p className="text-body-lg text-muted">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>
            </header>

            <form className="flex flex-col gap-y-space-sm">
              <PrimaryInput
                label="Correo electrónico"
                type="email"
                id="email"
                placeholder="example@email.com"
                autoComplete="email"
                required
              />

              <Button type="submit" size="lg" fullWidth>
                Enviar enlace
              </Button>
            </form>

            <p className="text-body-sm text-center text-muted">
              ¿Recordaste tu contraseña?{' '}
              <Link
                href="/login"
                className="text-label-md text-action underline-offset-4 transition-colors hover:underline"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
