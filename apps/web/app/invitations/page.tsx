import { IconArrowLeft, IconMailCheck } from '@tabler/icons-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AcceptInvitationForm } from '@components/organizations/AcceptInvitationForm';

import { getCurrentUser } from '@/lib/auth/current-user';
import { readInvitationTokenFromSearchParams } from '@/lib/organizations/accept-invitation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Aceptar invitación',
  robots: {
    index: false,
    follow: false,
  },
};

type InvitationsPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function InvitationsPage({ searchParams }: InvitationsPageProps) {
  const user = await getCurrentUser();

  if (user === null) {
    redirect('/session-expired');
  }

  const params = await searchParams;
  const initialToken = readInvitationTokenFromSearchParams(params.token);

  return (
    <main className="flex min-h-0 flex-1 flex-col p-space-sm pt-0">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-border bg-panel px-6 py-12">
        <div className="flex w-full max-w-md flex-col gap-6">
          <nav aria-label="Ruta de navegación" className="text-data-sm text-muted">
            <Link
              href="/organizations"
              className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-primary"
            >
              <IconArrowLeft aria-hidden="true" className="size-3.5" stroke={2} />
              Organizaciones
            </Link>
          </nav>

          <header className="flex items-start gap-3.5">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary-container/60 text-secondary"
            >
              <IconMailCheck className="size-5.5" stroke={1.75} />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="text-headline-md text-primary">Aceptar invitación</h1>
              <p className="text-body-sm text-muted">
                Pega el código que recibiste por correo para integrarte a una organización.
              </p>
            </div>
          </header>

          <AcceptInvitationForm userEmail={user.email} layout="page" initialToken={initialToken} />
        </div>
      </div>
    </main>
  );
}
