import Link from 'next/link';

import { PrimaryInput } from '@/components/ui/PrimaryInput';

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m3.5 7.5 7.3 5.1a2.1 2.1 0 0 0 2.4 0l7.3-5.1" />
    </svg>
  );
}

export default function ForgotPassword() {
  return (
    <div className="flex flex-col w-full h-screen">
      <section className="flex w-full flex-1 p-space-md pt-0">
        <div className="flex flex-col justify-center items-center w-full h-full rounded-xl bg-white border border-border">
          <div className="flex flex-col max-w-115 gap-y-space-md rise-in">
            <header className="flex flex-col gap-y-space-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
                <MailIcon />
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

              <button
                type="submit"
                className="w-full px-space-md py-space-sm rounded-full bg-action text-label-xl text-on-primary transition-colors hover:bg-action-hover"
              >
                Enviar enlace
              </button>
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
