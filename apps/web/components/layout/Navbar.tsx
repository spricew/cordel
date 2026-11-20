import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Legal', href: '/#legal' },
  { label: 'Políticas', href: '/#politicas' },
] as const;

export function Navbar() {
  return (
    <header>
      <nav
        aria-label="Principal"
        className="flex h-14 w-full items-center justify-between px-4 sm:px-6"
      >
        <Link
          href="/"
          className="rounded-sm text-headline-md text-primary transition-colors hover:text-action"
        >
          Cordel
        </Link>

        <ul className="flex items-center gap-x-4 text-label-md sm:gap-x-gutter sm:text-label-lg">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="whitespace-nowrap text-muted transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
