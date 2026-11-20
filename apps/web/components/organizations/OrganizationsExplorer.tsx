'use client';

import { useMemo, useState } from 'react';

import { Button } from '@components/ui/Button';
import { SearchField } from '@components/ui/SearchField';
import { PlusIcon, SearchIcon } from '@components/ui/icons';

import { OrganizationCard } from './OrganizationCard';
import { ORGANIZATION_FILTERS, WorkspaceSidebar } from './WorkspaceSidebar';
import type { OrganizationCardData, OrganizationFilter } from './types';

type OrganizationsExplorerProps = {
  organizations: OrganizationCardData[];
};

export function OrganizationsExplorer({ organizations }: OrganizationsExplorerProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OrganizationFilter>('all');

  const counts = useMemo<Record<OrganizationFilter, number>>(
    () => ({
      all: organizations.length,
      owned: organizations.filter((organization) => organization.role === 'OWNER').length,
      team: organizations.filter((organization) => organization.role !== 'OWNER').length,
    }),
    [organizations],
  );

  const totals = useMemo(
    () =>
      organizations.reduce(
        (accumulator, organization) => ({
          teams: accumulator.teams + organization.teams,
          members: accumulator.members + organization.members,
        }),
        { teams: 0, members: 0 },
      ),
    [organizations],
  );

  const filteredOrganizations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return organizations.filter((organization) => {
      if (filter === 'owned' && organization.role !== 'OWNER') return false;
      if (filter === 'team' && organization.role === 'OWNER') return false;
      if (normalizedQuery === '') return true;

      return [organization.name, organization.slug, organization.location].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [filter, organizations, query]);

  const hasOrganizations = organizations.length > 0;
  const hasResults = filteredOrganizations.length > 0;
  const countLabel =
    filteredOrganizations.length === organizations.length
      ? `${filteredOrganizations.length} ${
          filteredOrganizations.length === 1 ? 'organización' : 'organizaciones'
        }`
      : `${filteredOrganizations.length} de ${organizations.length} organizaciones`;

  function clearFilters() {
    setQuery('');
    setFilter('all');
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <WorkspaceSidebar
        activeFilter={filter}
        counts={counts}
        totalTeams={totals.teams}
        totalMembers={totals.members}
        onFilterChange={setFilter}
      />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col p-space-sm pt-0 pl-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-panel">
          <div className="flex-1 overflow-y-auto scrollbar-calm">
            <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
              <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-1.5">
                  <p className="text-label-sm uppercase tracking-caps text-muted">
                    Espacio de trabajo
                  </p>
                  <h1 className="text-display-lg text-primary">Organizaciones</h1>
                  <p className="max-w-xl text-body-md text-muted">
                    Cada organización mantiene sus equipos, personas y datos en un espacio propio.
                  </p>
                </div>
                <Button className="gap-2 self-start sm:self-auto">
                  <PlusIcon className="h-4 w-4" />
                  Nueva organización
                </Button>
              </header>

              <div className="mt-7 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {ORGANIZATION_FILTERS.map((item) => {
                  const isActive = filter === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFilter(item.id)}
                      aria-pressed={isActive}
                      className={[
                        'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-label-md transition-colors',
                        isActive
                          ? 'border-secondary-fixed-dim bg-secondary-container text-on-secondary-container'
                          : 'border-border bg-panel text-muted hover:bg-hover-muted',
                      ].join(' ')}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                      <span className="text-data-sm tabular-nums opacity-70">
                        {counts[item.id]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <SearchField
                  aria-label="Buscar organizaciones"
                  placeholder="Buscar por nombre, slug o ubicación…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full sm:max-w-xs"
                />
                <p aria-live="polite" className="text-data-sm text-muted">
                  {countLabel}
                </p>
              </div>

              {hasResults ? (
                <div className="mt-6 grid grid-cols-1 gap-space-md sm:grid-cols-2 2xl:grid-cols-3">
                  {filteredOrganizations.map((organization) => (
                    <OrganizationCard key={organization.id} organization={organization} />
                  ))}
                </div>
              ) : (
                <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface/50 px-6 py-16 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-container-high text-muted">
                    <SearchIcon className="h-5 w-5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-headline-sm text-primary">
                      {hasOrganizations
                        ? 'No encontramos organizaciones'
                        : 'Aún no tienes organizaciones'}
                    </p>
                    <p className="max-w-sm text-body-sm text-muted">
                      {hasOrganizations
                        ? 'Prueba con otro nombre, slug o ubicación, o vuelve a “Todas”.'
                        : 'Crea tu primera organización para empezar a ordenar equipos y personas.'}
                    </p>
                  </div>
                  {hasOrganizations ? (
                    <Button variant="secondary" onClick={clearFilters} className="mt-2">
                      Limpiar filtros
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
