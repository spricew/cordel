'use client';

import { IconMailForward, IconSearchOff } from '@tabler/icons-react';
import type { MembershipWithUser, Role } from '@cordel/types';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@components/ui/Button';
import { Chip } from '@components/ui/Chip';
import { SearchField } from '@components/ui/SearchField';

import {
  AVATAR_TONES,
  ROLE_LABELS,
  accentFor,
  formatShortDate,
  getInitials,
} from '@/lib/organizations/presentation';

type RoleFilter = 'all' | Role;

const ROLE_FILTERS: readonly { id: RoleFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'OWNER', label: 'Propietarios' },
  { id: 'ADMIN', label: 'Administradores' },
  { id: 'MEMBER', label: 'Miembros' },
];

type MembersSectionProps = {
  members: MembershipWithUser[];
  currentUserId: string;
  canManage: boolean;
  onOpenInvite: () => void;
};

export function MembersSection({
  members,
  currentUserId,
  canManage,
  onOpenInvite,
}: MembersSectionProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return members.filter((member) => {
      if (roleFilter !== 'all' && member.role !== roleFilter) return false;
      if (normalizedQuery === '') return true;

      return [member.user.name, member.user.email].some((field) =>
        field.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [members, query, roleFilter]);

  const countLabel =
    filteredMembers.length === members.length
      ? `${filteredMembers.length} ${filteredMembers.length === 1 ? 'miembro' : 'miembros'}`
      : `${filteredMembers.length} de ${members.length} miembros`;

  function clearFilters() {
    setQuery('');
    setRoleFilter('all');
    searchRef.current?.focus();
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          ref={searchRef}
          aria-label="Buscar miembros"
          placeholder="Buscar por nombre o correo…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full sm:max-w-xs"
        />

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p aria-live="polite" className="text-data-sm text-muted">
            {countLabel}
          </p>
          {canManage ? (
            <Button variant="secondary" onClick={onOpenInvite}>
              <IconMailForward aria-hidden="true" className="size-4" stroke={1.75} />
              Invitar persona
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por rol">
        {ROLE_FILTERS.map((item) => {
          const isActive = roleFilter === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setRoleFilter(item.id)}
              aria-pressed={isActive}
              className={[
                'inline-flex cursor-pointer select-none items-center rounded-full border px-3 py-1.5 text-label-md transition-colors',
                isActive
                  ? 'border-secondary-fixed-dim bg-secondary-container text-on-secondary-fixed-variant'
                  : 'border-border bg-panel text-muted hover:bg-hover-muted hover:text-primary',
              ].join(' ')}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {filteredMembers.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border bg-panel">
          <ul className="divide-y divide-border-subtle">
            {filteredMembers.map((member) => {
              const isSelf = member.userId === currentUserId;
              const accent = accentFor(member.user.email);

              return (
                <li
                  key={member.userId}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-hover-row sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className={`grid size-10 shrink-0 place-items-center rounded-full text-label-md ${AVATAR_TONES[accent]}`}
                    >
                      {getInitials(member.user.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-label-lg text-primary">
                        {member.user.name}
                        {isSelf ? (
                          <span className="ml-2 rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-muted">
                            Tú
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-data-sm text-muted">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pl-13.5 sm:justify-end sm:pl-0">
                    <span className="text-data-sm text-text-subtle">
                      Desde el {formatShortDate(member.createdAt)}
                    </span>
                    <Chip tone={member.role === 'OWNER' ? 'active' : 'neutral'}>
                      {ROLE_LABELS[member.role]}
                    </Chip>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="rise-in flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-container-low/40 px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-md border border-border-strong bg-panel text-muted">
            <IconSearchOff aria-hidden="true" className="size-6" stroke={1.5} />
          </span>
          <h2 className="mt-3 text-headline-sm text-primary">
            No encontramos miembros con esos filtros
          </h2>
          <p className="mt-1 max-w-sm text-body-sm text-muted">
            Ajusta el término de búsqueda o vuelve a mostrar todos los roles.
          </p>
          <Button variant="secondary" className="mt-5" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
