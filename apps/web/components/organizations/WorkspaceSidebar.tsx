'use client';

import { IconLayoutGrid, IconShieldCheck, IconUsers, type Icon } from '@tabler/icons-react';

import type { OrganizationFilter } from './types';

type FilterDefinition = {
  id: OrganizationFilter;
  label: string;
  icon: Icon;
};

export const ORGANIZATION_FILTERS: FilterDefinition[] = [
  { id: 'all', label: 'Todas', icon: IconLayoutGrid },
  { id: 'owned', label: 'Propias', icon: IconShieldCheck },
  { id: 'team', label: 'En equipo', icon: IconUsers },
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
  return (
    <aside className="hidden w-60 shrink-0 flex-col px-space-lg py-space-lg lg:flex">
      <nav aria-label="Filtrar organizaciones">
        <p className="px-3 text-label-sm uppercase tracking-caps text-muted">Vistas</p>
        <div className="mt-2 flex flex-col gap-1">
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
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-label-md transition-colors',
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-muted hover:bg-hover-muted hover:text-primary',
                ].join(' ')}
              >
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0" stroke={1.5} />
                <span className="flex-1 truncate">{item.label}</span>
                <span
                  className={`text-data-sm tabular-nums ${
                    isActive ? 'text-on-secondary-container/70' : 'text-text-subtle'
                  }`}
                >
                  {counts[item.id]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-auto rounded-lg border border-border bg-panel p-space-md">
        <p className="text-label-sm uppercase tracking-caps text-muted">Resumen</p>
        <dl className="mt-3 flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-body-sm text-muted">Organizaciones</dt>
            <dd className="text-label-md tabular-nums text-primary">{counts.all}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-body-sm text-muted">Equipos</dt>
            <dd className="text-label-md tabular-nums text-primary">{totalTeams}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-body-sm text-muted">Miembros</dt>
            <dd className="text-label-md tabular-nums text-primary">{totalMembers}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
