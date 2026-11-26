'use client';

import {
  IconArrowRight,
  IconCalendar,
  IconMailForward,
  IconPlus,
  IconShieldCheck,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react';
import type { AuditLog, MembershipWithUser, Role, Team } from '@cordel/types';

import { Button } from '@components/ui/Button';
import { Chip } from '@components/ui/Chip';

import {
  AVATAR_TONES,
  ROLE_LABELS,
  accentFor,
  formatDateTime,
  formatShortDate,
  getInitials,
} from '@/lib/organizations/presentation';

import { AUDIT_EVENT_META, formatAuditDetail } from './audit-meta';
import type { OrgSection } from './types';

type OverviewSectionProps = {
  teams: Team[];
  members: MembershipWithUser[];
  pendingInvitationsCount: number;
  auditLogs: AuditLog[] | null;
  currentUserId: string;
  currentUserRole: Role;
  canManage: boolean;
  createdAt: string;
  onNavigateSection: (section: OrgSection) => void;
  onOpenCreateTeam: () => void;
  onOpenInvite: () => void;
};

export function OverviewSection({
  teams,
  members,
  pendingInvitationsCount,
  auditLogs,
  currentUserId,
  currentUserRole,
  canManage,
  createdAt,
  onNavigateSection,
  onOpenCreateTeam,
  onOpenInvite,
}: OverviewSectionProps) {
  const previewTeams = teams.slice(0, 4);
  const previewMembers = members.slice(0, 5);
  const previewAudit = (auditLogs ?? []).slice(0, 4);

  const metrics = [
    {
      label: 'Equipos activos',
      value: String(teams.length),
      hint: teams.length === 1 ? 'Espacio aislado' : 'Espacios aislados',
      icon: IconUsersGroup,
      tone: 'bg-secondary-container/70 text-secondary',
      targetSection: 'teams' as OrgSection,
    },
    {
      label: 'Miembros',
      value: String(members.length),
      hint: 'Personas en la organización',
      icon: IconUsers,
      tone: 'bg-primary-fixed text-on-primary-fixed-variant',
      targetSection: 'members' as OrgSection,
    },
    canManage
      ? {
          label: 'Invitaciones pendientes',
          value: String(pendingInvitationsCount),
          hint: 'Por aceptar o revocar',
          icon: IconMailForward,
          tone: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
          targetSection: 'invitations' as OrgSection,
        }
      : {
          label: 'Creada el',
          value: formatShortDate(createdAt),
          hint: 'Fecha de registro',
          icon: IconCalendar,
          tone: 'bg-surface-container-high text-on-surface-variant',
          targetSection: null,
        },
    {
      label: 'Tu rol',
      value: ROLE_LABELS[currentUserRole],
      hint: canManage ? 'Gestión habilitada' : 'Acceso por equipos asignados',
      icon: IconShieldCheck,
      tone: 'bg-surface-container-high text-on-surface-variant',
      targetSection: null,
    },
  ];

  return (
    <div className="mt-8 flex flex-col gap-space-lg">
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const targetSection = metric.targetSection;

          return (
            <article
              key={metric.label}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface/50 p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-label-sm uppercase tracking-caps text-muted">
                  {metric.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`grid size-8 shrink-0 place-items-center rounded-sm ${metric.tone}`}
                >
                  <Icon className="size-4" stroke={1.75} />
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-headline-md tabular-nums text-primary">{metric.value}</p>
                {targetSection !== null ? (
                  <button
                    type="button"
                    onClick={() => onNavigateSection(targetSection)}
                    className="inline-flex cursor-pointer items-center gap-1 text-label-md text-action transition-colors hover:text-primary"
                  >
                    Ver
                    <IconArrowRight aria-hidden="true" className="size-3.5" stroke={2} />
                  </button>
                ) : null}
              </div>
              <p className="text-data-sm text-muted">{metric.hint}</p>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-12">
        <section
          aria-labelledby="overview-teams-title"
          className="flex flex-col rounded-lg border border-border bg-panel p-5 sm:p-6 xl:col-span-7"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="overview-teams-title" className="text-headline-sm text-primary">
                Equipos
              </h2>
              <p className="text-body-sm text-muted">
                Grupos de trabajo independientes dentro de la organización.
              </p>
            </div>
            {teams.length > 0 ? (
              <Button variant="ghost" onClick={() => onNavigateSection('teams')}>
                Ver todos
                <IconArrowRight aria-hidden="true" className="size-4" stroke={1.75} />
              </Button>
            ) : null}
          </div>

          {previewTeams.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-2.5">
              {previewTeams.map((team) => {
                const teamAccent = accentFor(team.slug);

                return (
                  <li
                    key={team.id}
                    className="flex items-center gap-3.5 rounded-md border border-border-subtle bg-surface/50 px-4 py-3"
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-9 shrink-0 place-items-center rounded-sm text-label-md ${AVATAR_TONES[teamAccent]}`}
                    >
                      {getInitials(team.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-lg text-primary">{team.name}</p>
                      <p className="truncate text-data-sm text-muted">
                        /{team.slug}
                        {team.description ? ` · ${team.description}` : ''}
                      </p>
                    </div>
                    <span className="hidden shrink-0 text-data-sm text-text-subtle sm:inline">
                      {formatShortDate(team.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-border-strong bg-surface-container-low/40 px-5 py-8 text-center">
              <p className="text-label-lg text-primary">Aún no hay equipos</p>
              <p className="mt-1 max-w-sm text-body-sm text-muted">
                Crea el primer equipo para separar tareas, miembros y responsabilidades.
              </p>
              {canManage ? (
                <Button variant="secondary" className="mt-4" onClick={onOpenCreateTeam}>
                  <IconPlus aria-hidden="true" className="size-4" stroke={2.5} />
                  Crear equipo
                </Button>
              ) : null}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-space-lg xl:col-span-5">
          <section
            aria-labelledby="overview-members-title"
            className="flex flex-col rounded-lg border border-border bg-panel p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="overview-members-title" className="text-headline-sm text-primary">
                  Miembros
                </h2>
                <p className="text-body-sm text-muted">Personas con acceso al espacio.</p>
              </div>
              <Button variant="ghost" onClick={() => onNavigateSection('members')}>
                Ver directorio
                <IconArrowRight aria-hidden="true" className="size-4" stroke={1.75} />
              </Button>
            </div>

            <ul className="mt-4 flex flex-col divide-y divide-border-subtle">
              {previewMembers.map((member) => {
                const isSelf = member.userId === currentUserId;
                const memberAccent = accentFor(member.user.email);

                return (
                  <li
                    key={member.userId}
                    className="flex items-center gap-3 py-3 first:pt-1 last:pb-1"
                  >
                    <span
                      aria-hidden="true"
                      className={`grid size-8 shrink-0 place-items-center rounded-full text-label-sm ${AVATAR_TONES[memberAccent]}`}
                    >
                      {getInitials(member.user.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-md text-primary">
                        {member.user.name}
                        {isSelf ? (
                          <span className="ml-1.5 text-data-sm font-normal text-muted">(Tú)</span>
                        ) : null}
                      </p>
                      <p className="truncate text-data-sm text-muted">{member.user.email}</p>
                    </div>
                    <Chip tone="neutral" className="shrink-0">
                      {ROLE_LABELS[member.role]}
                    </Chip>
                  </li>
                );
              })}
            </ul>

            {canManage ? (
              <Button variant="secondary" fullWidth className="mt-4" onClick={onOpenInvite}>
                <IconMailForward aria-hidden="true" className="size-4" stroke={1.75} />
                Invitar persona
              </Button>
            ) : null}
          </section>

          {canManage && auditLogs !== null ? (
            <section
              aria-labelledby="overview-audit-title"
              className="flex flex-col rounded-lg border border-border bg-panel p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id="overview-audit-title" className="text-headline-sm text-primary">
                  Actividad reciente
                </h2>
                <Button variant="ghost" onClick={() => onNavigateSection('audit')}>
                  Historial
                  <IconArrowRight aria-hidden="true" className="size-4" stroke={1.75} />
                </Button>
              </div>

              {previewAudit.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-3">
                  {previewAudit.map((entry) => {
                    const meta = AUDIT_EVENT_META[entry.action];
                    const Icon = meta.icon;
                    const detail = formatAuditDetail(entry);

                    return (
                      <li key={entry.id} className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${meta.tone}`}
                        >
                          <Icon className="size-3.5" stroke={2} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-body-sm text-primary">
                            <span className="font-medium">{entry.actor.name}</span> · {meta.label}
                          </p>
                          <p className="truncate text-data-sm text-muted">
                            {detail ?? formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-body-sm text-muted">No hay eventos registrados todavía.</p>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
