import type { Role } from '@cordel/types';

import { Chip } from '@components/ui/Chip';
import { MapPinIcon, TeamsIcon } from '@components/ui/icons';

import type { OrganizationAccent, OrganizationCardData } from './types';

const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
};

const AVATAR_TONES: Record<OrganizationAccent, string> = {
  sage: 'bg-secondary-container text-on-secondary-container',
  slate: 'bg-primary-fixed text-on-primary-fixed-variant',
  clay: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  sand: 'bg-surface-container-high text-on-surface-variant',
  moss: 'bg-secondary-fixed-dim text-on-secondary-fixed-variant',
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function OrganizationCard({ organization }: { organization: OrganizationCardData }) {
  const { name, slug, role, members, teams, location, accent } = organization;

  return (
    <article className="flex h-full min-h-56 flex-col rounded-lg border border-border bg-panel p-space-lg">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-md text-label-xl ${AVATAR_TONES[accent]}`}
        >
          {getInitials(name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-headline-sm text-primary">{name}</h2>
          <p className="truncate text-data-sm text-muted">/{slug}</p>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-2.5 text-data-sm text-muted">
        <li className="flex min-w-0 items-center gap-2">
          <TeamsIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {teams} {teams === 1 ? 'equipo' : 'equipos'}
          </span>
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <MapPinIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">{location}</span>
        </li>
      </ul>

      <footer className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
        <Chip tone="neutral">{ROLE_LABELS[role]}</Chip>
        <span className="shrink-0 text-data-sm text-muted">
          {members} {members === 1 ? 'miembro' : 'miembros'}
        </span>
      </footer>
    </article>
  );
}
