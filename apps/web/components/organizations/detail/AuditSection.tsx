'use client';

import { IconActivity } from '@tabler/icons-react';
import type { AuditLog } from '@cordel/types';
import { useMemo, useState } from 'react';

import { formatDateTime } from '@/lib/organizations/presentation';

import { AUDIT_EVENT_META, formatAuditDetail } from './audit-meta';

type AuditFilter = 'all' | 'teams' | 'members';

const AUDIT_FILTERS: readonly { id: AuditFilter; label: string }[] = [
  { id: 'all', label: 'Toda la actividad' },
  { id: 'teams', label: 'Organización y equipos' },
  { id: 'members', label: 'Miembros e invitaciones' },
];

export function AuditSection({ auditLogs }: { auditLogs: AuditLog[] }) {
  const [filter, setFilter] = useState<AuditFilter>('all');

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return auditLogs;

    return auditLogs.filter((entry) => AUDIT_EVENT_META[entry.action].category === filter);
  }, [auditLogs, filter]);

  if (auditLogs.length === 0) {
    return (
      <div className="rise-in mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-container-low/40 px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-md border border-border-strong bg-panel text-muted">
          <IconActivity aria-hidden="true" className="size-7" stroke={1.5} />
        </span>
        <div role="status" className="mt-4 flex max-w-md flex-col gap-1.5">
          <h2 className="text-headline-md text-primary">Aún no hay actividad registrada</h2>
          <p className="text-body-md text-muted">
            Las acciones sensibles como creación de equipos, invitaciones e incorporaciones quedarán
            registradas aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar eventos">
          {AUDIT_FILTERS.map((item) => {
            const isActive = filter === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
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

        <p aria-live="polite" className="text-data-sm text-muted">
          {filteredLogs.length} {filteredLogs.length === 1 ? 'evento' : 'eventos'}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-panel">
        <ol className="divide-y divide-border-subtle">
          {filteredLogs.map((entry) => {
            const meta = AUDIT_EVENT_META[entry.action];
            const Icon = meta.icon;
            const detail = formatAuditDetail(entry);

            return (
              <li
                key={entry.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3.5 sm:items-center">
                  <span
                    aria-hidden="true"
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${meta.tone}`}
                  >
                    <Icon className="size-4.5" stroke={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-body-md text-primary">
                      <span className="font-medium">{entry.actor.name}</span> · {meta.label}
                    </p>
                    <p className="truncate text-data-sm text-muted">
                      {detail ?? entry.actor.email}
                    </p>
                  </div>
                </div>

                <time
                  dateTime={entry.createdAt}
                  className="shrink-0 pl-12.5 text-data-sm tabular-nums text-text-subtle sm:pl-0"
                >
                  {formatDateTime(entry.createdAt)}
                </time>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
