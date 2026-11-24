import Link from 'next/link';

import { ButtonLink } from '@components/ui/Button';

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/80 backdrop-blur-lg backdrop-saturate-200">
      <nav
        aria-label="Principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6"
      >
        <Link
          href="/"
          className="text-headline-md text-primary transition-colors hover:text-action"
        >
          Cordel
        </Link>

        <ul className="hidden items-center gap-x-gutter md:flex">
          <li>
            <Link
              href="/#producto"
              className="text-label-lg text-muted transition-colors hover:text-primary"
            >
              Producto
            </Link>
          </li>
          <li>
            <Link
              href="/#aislamiento"
              className="text-label-lg text-muted transition-colors hover:text-primary"
            >
              Aislamiento
            </Link>
          </li>
          <li>
            <Link
              href="/#roles"
              className="text-label-lg text-muted transition-colors hover:text-primary"
            >
              Roles
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-x-space-md">
          <Link
            href="/login"
            className="hidden text-label-lg text-muted transition-colors hover:text-primary sm:inline-flex"
          >
            Iniciar sesión
          </Link>
          <ButtonLink href="/register" size="md">
            Crear cuenta
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}
