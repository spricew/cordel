import { IconAlertTriangle } from '@tabler/icons-react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { OrganizationWorkspace } from '@components/organizations/detail/OrganizationWorkspace';
import { isValidOrgSection, type OrgSection } from '@components/organizations/detail/types';
import { ButtonLink } from '@components/ui/Button';

import { getCurrentUser } from '@/lib/auth/current-user';
import { getOrganizationDetail } from '@/lib/organizations/get-detail';

type OrganizationPageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
};

export async function generateMetadata({ params }: OrganizationPageProps): Promise<Metadata> {
  const user = await getCurrentUser();
  if (user === null) {
    return { title: 'Organización' };
  }

  const { orgSlug } = await params;
  const result = await getOrganizationDetail(orgSlug, user.id);

  if (!result.ok) {
    return { title: 'Organización' };
  }

  return {
    title: result.data.organization.name,
  };
}

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: OrganizationPageProps) {
  const user = await getCurrentUser();

  if (user === null) {
    redirect('/session-expired');
  }

  const [{ orgSlug }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const result = await getOrganizationDetail(orgSlug, user.id);

  if (!result.ok) {
    if (result.reason === 'unauthorized') {
      redirect('/session-expired');
    }

    if (result.reason === 'not-found') {
      notFound();
    }

    return <OrganizationUnavailable orgSlug={orgSlug} />;
  }

  const rawTab = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab;
  const initialSection: OrgSection = isValidOrgSection(rawTab, result.data.canManage)
    ? rawTab
    : 'overview';

  return <OrganizationWorkspace data={result.data} initialSection={initialSection} />;
}

function OrganizationUnavailable({ orgSlug }: { orgSlug: string }) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col p-space-sm pt-0 lg:pl-0">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-panel px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-surface-container-high text-muted">
            <IconAlertTriangle aria-hidden="true" className="size-5" stroke={1.5} />
          </span>
          <div className="flex max-w-sm flex-col gap-1">
            <h1 className="text-headline-sm text-primary">No pudimos cargar la organización</h1>
            <p className="text-body-sm text-muted">
              El servicio no respondió al consultar /{orgSlug}. Vuelve a intentarlo en un momento.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <ButtonLink href="/organizations" variant="ghost">
              Volver a organizaciones
            </ButtonLink>
            <ButtonLink href={`/organizations/${encodeURIComponent(orgSlug)}`} variant="secondary">
              Reintentar
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
