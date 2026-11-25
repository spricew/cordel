'use client';

import {
  IconBuilding,
  IconStack2,
  IconUser,
  IconUserCheck,
  IconUsers,
  IconUsersGroup,
  type Icon,
} from '@tabler/icons-react';

import type { OrganizationFilter } from './types';

type FilterDefinition = {
  id: OrganizationFilter;
  label: string;
  icon: Icon;
};

export const ORGANIZATION_FILTERS: FilterDefinition[] = [
  { id: 'all', label: 'Todas', icon: IconStack2 },
  { id: 'owned', label: 'Propias', icon: IconUserCheck },
  { id: 'team', label: 'Compartidas', icon: IconUsers },
];

type WorkspaceSidebarProps = {
  activeFilter: OrganizationFilter;
  counts: Record<OrganizationFilter, number>;
  totalTeams: number;
  totalMembers: number;
  onFilterChange: (filter: OrganizationFilter) => void;
};

export function WorkspaceSidebar({
  activeFilter,
  counts,
  totalTeams,
  totalMembers,
  onFilterChange,
}: WorkspaceSidebarProps) {
  const summary = [
    { label: 'Organizaciones', value: counts.all, icon: IconBuilding },
    { label: 'Equipos', value: totalTeams, icon: IconUsersGroup },
    { label: 'Miembros', value: totalMembers, icon: IconUser },
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col px-space-lg py-space-lg lg:flex">
      <nav aria-label="Filtrar organizaciones">
        <p className="px-3 text-label-sm font-semibold text-muted">Vistas</p>
        <div className="mt-2 flex flex-col gap-0.5">
          {ORGANIZATION_FILTERS.map((item) => {
            const isActive = activeFilter === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilterChange(item.id)}
                aria-pressed={isActive}
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
                <span
                  className={[
                    'text-body-sm tabular-nums',
                    isActive ? 'text-secondary/80' : 'text-muted',
                  ].join(' ')}
                >
                  {counts[item.id]}
                </span>
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
                <Icon aria-hidden="true" className="size-5 shrink-0 text-muted" stroke={1.75} />
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
