import { IconAlertTriangle } from '@tabler/icons-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { OrganizationsExplorer } from '@components/organizations/OrganizationsExplorer';
import { ButtonLink } from '@components/ui/Button';

import { getCurrentUser } from '@/lib/auth/current-user';
import { toOrganizationCardData } from '@/lib/organizations/card-data';
import { listMineOrganizations } from '@/lib/organizations/list-mine';

export const metadata: Metadata = {
  title: 'Organizaciones',
};

export default async function Organizations() {
  if ((await getCurrentUser()) === null) {
    redirect('/session-expired');
  }

  const result = await listMineOrganizations();

  if (!result.ok) {
    if (result.reason === 'unauthorized') {
      redirect('/session-expired');
    }

    return <OrganizationsUnavailable />;
  }

  return <OrganizationsExplorer organizations={result.organizations.map(toOrganizationCardData)} />;
}

function OrganizationsUnavailable() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col p-space-sm pt-0 lg:pl-0">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-panel px-6 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-container-high text-muted">
            <IconAlertTriangle aria-hidden="true" className="h-5 w-5" stroke={1.5} />
          </span>
          <div className="flex max-w-sm flex-col gap-1">
            <h1 className="text-headline-sm text-primary">No pudimos cargar tus organizaciones</h1>
            <p className="text-body-sm text-muted">
              El servicio no respondió. Vuelve a intentarlo en un momento.
            </p>
          </div>
          <ButtonLink href="/organizations" variant="secondary" className="mt-2">
            Reintentar
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
