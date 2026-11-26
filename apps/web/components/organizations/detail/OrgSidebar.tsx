'use client';

import { IconArrowLeft, IconShieldCheck, IconUser, IconUsersGroup } from '@tabler/icons-react';
import type { Role } from '@cordel/types';
import Link from 'next/link';

import {
  AVATAR_TONES,
  ROLE_LABELS,
  accentFor,
  getInitials,
} from '@/lib/organizations/presentation';

import { ORG_NAV_ITEMS, type OrgSection } from './types';

type OrgSidebarProps = {
  organizationName: string;
  organizationSlug: string;
  currentUserRole: Role;
  canManage: boolean;
  activeSection: OrgSection;
  counts: {
    teams: number;
    members: number;
    invitations: number;
    audit: number;
  };
  onSectionChange: (section: OrgSection) => void;
};

export function OrgSidebar({
  organizationName,
  organizationSlug,
  currentUserRole,
  canManage,
  activeSection,
  counts,
  onSectionChange,
}: OrgSidebarProps) {
  const accent = accentFor(organizationSlug);
  const visibleItems = ORG_NAV_ITEMS.filter((item) => !item.adminOnly || canManage);

  const countForSection: Partial<Record<OrgSection, number>> = {
    teams: counts.teams,
    members: counts.members,
    invitations: counts.invitations,
    audit: counts.audit,
  };

  const summary = [
    { label: 'Equipos', value: String(counts.teams), icon: IconUsersGroup },
    { label: 'Miembros', value: String(counts.members), icon: IconUser },
    { label: 'Tu rol', value: ROLE_LABELS[currentUserRole], icon: IconShieldCheck },
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col px-space-lg py-space-lg lg:flex">
      <Link
        href="/organizations"
        className="inline-flex min-h-9 items-center gap-2 self-start rounded-sm px-2 py-1.5 text-sidebar text-muted transition-colors hover:bg-hover-muted hover:text-primary"
      >
        <IconArrowLeft aria-hidden="true" className="size-4 shrink-0" stroke={2} />
        <span>Organizaciones</span>
      </Link>

      <div className="mt-4 flex items-center gap-3 rounded-md border border-border-subtle bg-panel/70 px-3 py-2.5">
        <span
          aria-hidden="true"
          className={`grid size-9 shrink-0 place-items-center rounded-sm text-label-md ${AVATAR_TONES[accent]}`}
        >
          {getInitials(organizationName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sidebar text-primary">{organizationName}</p>
          <p className="truncate text-data-sm text-muted">/{organizationSlug}</p>
        </div>
      </div>

      <nav aria-label="Secciones de la organización" className="mt-6">
        <p className="px-3 text-label-sm font-semibold text-muted">Espacio</p>
        <div className="mt-2 flex flex-col gap-0.5">
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;
            const Icon = item.icon;
            const badgeCount = countForSection[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'flex min-h-9 w-full cursor-pointer select-none items-center gap-2.5 rounded-sm px-3 py-2 text-left text-sidebar transition-colors duration-150 ease-out',
                  isActive
                    ? 'bg-secondary-container/60 text-on-secondary-fixed-variant'
                    : 'text-on-surface hover:bg-hover-muted',
                ].join(' ')}
              >
                <Icon
                  aria-hidden="true"
                  className={[
                    'size-5 shrink-0 transition-colors',
                    isActive ? 'text-secondary' : 'text-on-surface',
                  ].join(' ')}
                  stroke={2}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {badgeCount !== undefined ? (
                  <span
                    className={[
                      'text-body-sm tabular-nums',
                      isActive ? 'text-secondary/80' : 'text-muted',
                    ].join(' ')}
                  >
                    {badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto border-t border-border-subtle pt-space-md">
        <p className="px-3 text-label-sm font-semibold text-muted">Resumen</p>
        <dl className="mt-2 flex flex-col gap-0.5">
          {summary.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="flex min-h-9 items-center gap-2.5 px-3">
                <Icon aria-hidden="true" className="size-4.5 shrink-0 text-muted" stroke={1.75} />
                <dt className="flex-1 text-sidebar text-on-surface-variant">{stat.label}</dt>
                <dd className="text-body-sm tabular-nums text-primary">{stat.value}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </aside>
  );
}
