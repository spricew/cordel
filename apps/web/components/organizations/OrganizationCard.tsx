import { IconArrowUpRight, IconCalendar, IconUsersGroup } from '@tabler/icons-react';
import Link from 'next/link';

import { Chip } from '@components/ui/Chip';

import {
  AVATAR_TONES,
  ROLE_LABELS,
  formatShortDate,
  getInitials,
} from '@/lib/organizations/presentation';

import type { OrganizationCardData } from './types';

export function OrganizationCard({ organization }: { organization: OrganizationCardData }) {
  const { name, slug, role, members, teams, createdAt, accent } = organization;

  return (
    <article className="h-full">
      <Link
        href={`/organizations/${slug}`}
        className="group flex h-full min-h-56 flex-col rounded-lg border border-border bg-panel p-space-lg transition-colors duration-150 ease-out hover:border-border-strong hover:bg-hover-row focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              aria-hidden="true"
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-md text-label-xl ${AVATAR_TONES[accent]}`}
            >
              {getInitials(name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-headline-sm text-primary transition-colors group-hover:text-action">
                {name}
              </h2>
              <p className="truncate text-data-sm text-muted">/{slug}</p>
            </div>
          </div>
          <IconArrowUpRight
            aria-hidden="true"
            className="mt-1 size-4 shrink-0 text-text-subtle opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-visible:opacity-100"
            stroke={1.75}
          />
        </div>

        <ul className="mt-6 flex flex-col gap-2.5 text-data-sm text-muted">
          <li className="flex min-w-0 items-center gap-2">
            <IconUsersGroup aria-hidden="true" className="h-4 w-4 shrink-0" stroke={1.5} />
            <span className="truncate">
              {teams} {teams === 1 ? 'equipo' : 'equipos'}
            </span>
          </li>
          <li className="flex min-w-0 items-center gap-2">
            <IconCalendar aria-hidden="true" className="h-4 w-4 shrink-0" stroke={1.5} />
            <span className="truncate">Creada el {formatShortDate(createdAt)}</span>
          </li>
        </ul>

        <footer className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
          <Chip tone="neutral">{ROLE_LABELS[role]}</Chip>
          <span className="shrink-0 text-data-sm text-muted">
            {members} {members === 1 ? 'miembro' : 'miembros'}
          </span>
        </footer>
      </Link>
    </article>
  );
}
