'use client';

import {
  IconBuildingCommunity,
  IconBuildingPlus,
  IconSearchOff,
  IconShieldCheck,
  IconUsersGroup,
  type Icon,
} from '@tabler/icons-react';

import { Button } from '@components/ui/Button';

import type { OrganizationFilter } from './types';

type EmptyStep = {
  label: string;
  icon: Icon;
  tone: string;
};

const EMPTY_STEPS: EmptyStep[] = [
  {
    label: 'Crea la organización',
    icon: IconBuildingPlus,
    tone: 'bg-secondary-container/60 text-secondary',
  },
  {
    label: 'Suma equipos y personas',
    icon: IconUsersGroup,
    tone: 'bg-primary-fixed text-on-primary-fixed-variant',
  },
  {
    label: 'Define roles y permisos',
    icon: IconShieldCheck,
    tone: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  },
];

type EmptyOrganizationsProps = {
  variant: 'empty';
};

type NoResultsProps = {
  variant: 'no-results';
  query: string;
  activeFilter: OrganizationFilter;
  filterLabel: string;
  onClearFilters: () => void;
};

type OrganizationEmptyStateProps = EmptyOrganizationsProps | NoResultsProps;

type EmptyStateMarkProps = {
  variant: OrganizationEmptyStateProps['variant'];
};

function EmptyStateMark({ variant }: EmptyStateMarkProps) {
  const isNoResults = variant === 'no-results';
  const Icon = isNoResults ? IconSearchOff : IconBuildingCommunity;

  return (
    <div
      aria-hidden="true"
      className="relative mb-1 grid h-20 w-24 place-items-center sm:h-24 sm:w-28"
    >
      <span
        className={[
          'absolute inset-0 rounded-full',
          isNoResults
            ? 'bg-[radial-gradient(circle_at_50%_50%,var(--color-surface-dim),transparent_68%)]'
            : 'bg-[radial-gradient(circle_at_50%_50%,var(--color-secondary-container),transparent_68%)]',
        ].join(' ')}
      />
      <span
        className={[
          'absolute left-3 top-5 h-14 w-14 -rotate-6 rounded-md',
          isNoResults ? 'bg-surface-container-high/80' : 'bg-tertiary-fixed/70',
        ].join(' ')}
      />
      <span
        className={[
          'absolute right-3 top-5 h-14 w-14 rotate-6 rounded-md',
          isNoResults ? 'bg-surface-container/80' : 'bg-primary-fixed/70',
        ].join(' ')}
      />
      <span
        className={[
          'relative grid h-16 w-16 place-items-center rounded-md border bg-panel',
          isNoResults
            ? 'border-border-strong text-muted'
            : 'border-secondary-fixed-dim text-secondary',
        ].join(' ')}
      >
        <Icon className="h-7 w-7" stroke={1.5} />
      </span>
    </div>
  );
}

function EmptyOrganizations() {
  return (
    <div className="rise-in mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-container-low/40 px-6 py-10 text-center sm:py-12">
      <EmptyStateMark variant="empty" />
      <div role="status" className="mt-1 flex max-w-md flex-col gap-2">
        <h2 className="text-pretty text-headline-md text-primary">Aún no tienes organizaciones</h2>
        <p className="text-pretty text-body-md text-muted">
          Crea tu primera organización para reunir equipos, personas y permisos en un espacio
          propio.
        </p>
      </div>
      <ul className="mt-6 grid w-full max-w-2xl gap-3 text-left sm:mt-7 sm:grid-cols-3">
        {EMPTY_STEPS.map((step) => {
          const Icon = step.icon;

          return (
            <li key={step.label} className="flex items-center gap-2.5 px-1 sm:justify-center">
              <span
                className={['grid size-9 shrink-0 place-items-center rounded-full', step.tone].join(
                  ' ',
                )}
              >
                <Icon aria-hidden="true" className="size-4" stroke={2} />
              </span>
              <span className="text-body-sm text-on-surface-variant">{step.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NoResults({ query, activeFilter, filterLabel, onClearFilters }: NoResultsProps) {
  const normalizedQuery = query.trim();
  const hasQuery = normalizedQuery.length > 0;
  const hasFilter = activeFilter !== 'all';
  const displayQuery =
    normalizedQuery.length > 48 ? `${normalizedQuery.slice(0, 48)}…` : normalizedQuery;
  const title = hasQuery
    ? `Sin resultados para “${displayQuery}”`
    : hasFilter
      ? `No hay organizaciones en “${filterLabel}”`
      : 'No encontramos organizaciones';
  const description = hasQuery
    ? 'La búsqueda revisa el nombre y el slug. Prueba con otro término o ajusta el filtro.'
    : hasFilter
      ? 'Cambia el filtro o vuelve a “Todas” para ver todas tus organizaciones.'
      : 'Prueba con otro término o ajusta los filtros.';
  const actionLabel =
    hasQuery && hasFilter
      ? 'Limpiar búsqueda y filtros'
      : hasQuery
        ? 'Borrar búsqueda'
        : 'Ver todas';

  return (
    <div className="rise-in mt-6 flex flex-1 flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-container-low/40 px-6 py-4 text-center sm:py-6">
      <EmptyStateMark variant="no-results" />
      <div role="status" className="mt-1 flex max-w-md flex-col gap-2">
        <h2 className="text-balance wrap-break-word text-headline-md text-primary">{title}</h2>
        <p className="text-pretty text-body-md text-muted">{description}</p>
      </div>
      <Button variant="secondary" onClick={onClearFilters} className="mt-6">
        {actionLabel}
      </Button>
    </div>
  );
}

export function OrganizationEmptyState(props: OrganizationEmptyStateProps) {
  if (props.variant === 'empty') {
    return <EmptyOrganizations />;
  }

  return <NoResults {...props} />;
}
