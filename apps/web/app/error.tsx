'use client';

import Link from 'next/link';

import { Button, ButtonLink } from '@components/ui/Button';

type ErrorPageProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

function TangleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 120"
      fill="none"
      className="h-24 w-full max-w-xs text-sage"
    >
      <path
        d="M6 82C44 82 52 40 90 42c36 2 32 42 4 44-28 2-24-40 12-44 40-5 44 50 80 46 28-3 28-46 62-48 32-2 40 22 66 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M6 82C44 82 52 40 90 42c36 2 32 42 4 44-28 2-24-40 12-44 40-5 44 50 80 46 28-3 28-46 62-48 32-2 40 22 66 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="6" cy="82" r="3" className="fill-clay" />
      <circle cx="314" cy="58" r="3" className="fill-clay" />
    </svg>
  );
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  return (
    <div className="relative flex min-h-svh flex-col bg-canvas">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary-container/60 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 translate-x-24 -translate-y-4 rounded-full bg-tertiary-fixed/50 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-6 py-5">
        <Link
          href="/"
          className="text-headline-md text-primary transition-colors hover:text-action"
        >
          Cordel
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-24 pt-8">
        <div role="alert" className="flex w-full max-w-4xl flex-col items-center text-center">
          <div className="rise-in mb-8 flex w-full justify-center">
            <TangleMark />
          </div>

          <h1 className="rise-in text-balance text-display-xl text-primary [animation-delay:100ms]">
            El hilo se enredó.
          </h1>

          <p className="rise-in mt-5 max-w-xl text-body-lg text-muted [animation-delay:180ms]">
            Algo interrumpió esta vista. Puedes intentar de nuevo; si el problema continúa, vuelve
            al inicio y retoma desde ahí.
          </p>

          <div className="rise-in mt-9 flex flex-col items-center gap-3 sm:flex-row [animation-delay:260ms]">
            <Button size="lg" onClick={() => retry()}>
              Reintentar
            </Button>
            <ButtonLink href="/" variant="secondary" size="lg">
              Volver al inicio
            </ButtonLink>
          </div>

          {error.digest ? (
            <p className="mt-8 text-data-sm text-text-subtle">
              Referencia <span className="tabular-nums">{error.digest}</span>
            </p>
          ) : null}
        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-8 text-data-sm text-text-subtle">
        © 2026 Cordel
      </footer>
    </div>
  );
}
