'use client';

import {
  IconCalendar,
  IconLock,
  IconPlus,
  IconSearchOff,
  IconUsersGroup,
} from '@tabler/icons-react';
import type { Team } from '@cordel/types';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@components/ui/Button';
import { SearchField } from '@components/ui/SearchField';

import {
  AVATAR_TONES,
  accentFor,
  formatShortDate,
  getInitials,
} from '@/lib/organizations/presentation';

type TeamsSectionProps = {
  teams: Team[];
  canManage: boolean;
  onOpenCreateTeam: () => void;
};

export function TeamsSection({ teams, canManage, onOpenCreateTeam }: TeamsSectionProps) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredTeams = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery === '') return teams;

    return teams.filter((team) =>
      [team.name, team.slug, team.description ?? ''].some((field) =>
        field.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query, teams]);

  const countLabel =
    filteredTeams.length === teams.length
      ? `${filteredTeams.length} ${filteredTeams.length === 1 ? 'equipo' : 'equipos'}`
      : `${filteredTeams.length} de ${teams.length} equipos`;

  function clearSearch() {
    setQuery('');
    searchRef.current?.focus();
  }

  if (teams.length === 0) {
    return (
      <div className="rise-in mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-container-low/40 px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-md border border-secondary-fixed-dim bg-panel text-secondary">
          <IconUsersGroup aria-hidden="true" className="size-7" stroke={1.5} />
        </span>
        <div role="status" className="mt-4 flex max-w-md flex-col gap-1.5">
          <h2 className="text-headline-md text-primary">Aún no hay equipos creados</h2>
          <p className="text-body-md text-muted">
            Cada equipo agrupa tareas y personas en un espacio aislado. Los datos de un equipo no se
            mezclan con los de otro.
          </p>
        </div>
        {canManage ? (
          <Button className="mt-6" onClick={onOpenCreateTeam}>
            <IconPlus aria-hidden="true" className="size-[1.15em]" stroke={2.5} />
            Crear primer equipo
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          ref={searchRef}
          aria-label="Buscar equipos"
          placeholder="Buscar por nombre o identificador…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full sm:max-w-xs"
        />
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p aria-live="polite" className="text-data-sm text-muted">
            {countLabel}
          </p>
          {canManage ? (
            <Button variant="secondary" onClick={onOpenCreateTeam}>
              <IconPlus aria-hidden="true" className="size-4" stroke={2.5} />
              Nuevo equipo
            </Button>
          ) : null}
        </div>
      </div>

      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 2xl:grid-cols-3">
          {filteredTeams.map((team) => {
            const accent = accentFor(team.slug);

            return (
              <article
                key={team.id}
                className="flex h-full min-h-48 flex-col rounded-lg border border-border bg-panel p-space-lg transition-colors hover:border-border-strong"
              >
                <div className="flex items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className={`grid size-11 shrink-0 place-items-center rounded-md text-label-lg ${AVATAR_TONES[accent]}`}
                  >
                    {getInitials(team.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-headline-sm text-primary">{team.name}</h2>
                    <p className="truncate text-data-sm text-muted">/{team.slug}</p>
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 text-body-sm text-muted">
                  {team.description?.trim() ? team.description : 'Sin descripción registrada.'}
                </p>

                <footer className="mt-auto flex items-center justify-between gap-3 border-t border-border-subtle pt-4 text-data-sm text-muted">
                  <span className="inline-flex items-center gap-1.5 text-secondary">
                    <IconLock aria-hidden="true" className="size-3.5 shrink-0" stroke={1.75} />
                    Espacio aislado
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5">
                    <IconCalendar aria-hidden="true" className="size-3.5 shrink-0" stroke={1.5} />
                    {formatShortDate(team.createdAt)}
                  </span>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rise-in flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-container-low/40 px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-md border border-border-strong bg-panel text-muted">
            <IconSearchOff aria-hidden="true" className="size-6" stroke={1.5} />
          </span>
          <h2 className="mt-3 text-headline-sm text-primary">
            Sin resultados para “{query.trim()}”
          </h2>
          <p className="mt-1 max-w-sm text-body-sm text-muted">
            Prueba con otro término de búsqueda para encontrar el equipo.
          </p>
          <Button variant="secondary" className="mt-5" onClick={clearSearch}>
            Borrar búsqueda
          </Button>
        </div>
      )}
    </div>
  );
}
