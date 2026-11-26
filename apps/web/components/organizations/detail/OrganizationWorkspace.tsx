'use client';

import { IconArrowLeft, IconCalendar, IconMailPlus, IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { Button } from '@components/ui/Button';
import { Chip } from '@components/ui/Chip';

import type { OrganizationDetailData } from '@/lib/organizations/get-detail';
import {
  AVATAR_TONES,
  ROLE_LABELS,
  accentFor,
  formatShortDate,
  getInitials,
} from '@/lib/organizations/presentation';

import { AuditSection } from './AuditSection';
import { CreateTeamModal } from './CreateTeamModal';
import { InvitationsSection } from './InvitationsSection';
import { InviteMemberModal } from './InviteMemberModal';
import { MembersSection } from './MembersSection';
import { OrgSidebar } from './OrgSidebar';
import { OverviewSection } from './OverviewSection';
import { TeamsSection } from './TeamsSection';
import { ORG_NAV_ITEMS, type OrgSection } from './types';

type OrganizationWorkspaceProps = {
  data: OrganizationDetailData;
  initialSection: OrgSection;
};

export function OrganizationWorkspace({ data, initialSection }: OrganizationWorkspaceProps) {
  const {
    organization,
    currentUserId,
    currentUserRole,
    canManage,
    teams,
    members,
    invitations,
    auditLogs,
    renderedAt,
  } = data;

  const [activeSection, setActiveSection] = useState<OrgSection>(initialSection);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const closeCreateTeam = useCallback(() => setIsCreateTeamOpen(false), []);
  const closeInvite = useCallback(() => setIsInviteOpen(false), []);

  const accent = accentFor(organization.slug);
  const pendingInvitations = invitations ?? [];
  const auditEntries = auditLogs ?? [];
  const visibleItems = ORG_NAV_ITEMS.filter((item) => !item.adminOnly || canManage);

  const counts = {
    teams: teams.length,
    members: members.length,
    invitations: pendingInvitations.length,
    audit: auditEntries.length,
  };

  function handleSectionChange(section: OrgSection) {
    setActiveSection(section);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (section === 'overview') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', section);
      }
      window.history.replaceState(null, '', url.toString());
    }
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <OrgSidebar
        organizationName={organization.name}
        organizationSlug={organization.slug}
        currentUserRole={currentUserRole}
        canManage={canManage}
        activeSection={activeSection}
        counts={counts}
        onSectionChange={handleSectionChange}
      />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col p-space-sm pt-0 lg:pl-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-panel">
          <div className="flex-1 overflow-y-auto scrollbar-calm">
            <div className="flex min-h-full w-full flex-col px-6 py-8 lg:px-14 lg:py-12">
              <nav
                aria-label="Ruta de navegación"
                className="mb-5 flex items-center gap-2 text-data-sm text-muted"
              >
                <Link
                  href="/organizations"
                  className="inline-flex items-center gap-1.5 rounded-sm transition-colors hover:text-primary"
                >
                  <IconArrowLeft aria-hidden="true" className="size-3.5" stroke={2} />
                  Organizaciones
                </Link>
                <span aria-hidden="true" className="text-outline-variant">
                  /
                </span>
                <span className="truncate font-medium text-primary">{organization.name}</span>
              </nav>

              <header className="flex flex-col gap-5 border-b border-border-subtle pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <span
                    aria-hidden="true"
                    className={`grid size-14 shrink-0 place-items-center rounded-md text-headline-sm ${AVATAR_TONES[accent]}`}
                  >
                    {getInitials(organization.name)}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="truncate text-display-lg text-primary">{organization.name}</h1>
                      <Chip tone="neutral">{ROLE_LABELS[currentUserRole]}</Chip>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-data-sm text-muted">
                      <span>/{organization.slug}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <IconCalendar aria-hidden="true" className="size-3.5" stroke={1.5} />
                        Creada el {formatShortDate(organization.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {canManage ? (
                  <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                    <Button variant="secondary" onClick={() => setIsInviteOpen(true)}>
                      <IconMailPlus aria-hidden="true" className="size-4.5" stroke={1.75} />
                      Invitar
                    </Button>
                    <Button onClick={() => setIsCreateTeamOpen(true)}>
                      <IconPlus aria-hidden="true" className="size-[1.15em]" stroke={2.75} />
                      Nuevo equipo
                    </Button>
                  </div>
                ) : null}
              </header>

              {/* Navegación horizontal en pantallas pequeñas */}
              <div className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {visibleItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSectionChange(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={[
                        'inline-flex shrink-0 cursor-pointer select-none items-center gap-2 rounded-full border px-3 py-1.5 text-sidebar transition-colors duration-150 ease-out',
                        isActive
                          ? 'border-secondary-fixed-dim bg-secondary-container text-on-secondary-fixed-variant'
                          : 'border-border bg-panel text-on-surface hover:bg-hover-muted',
                      ].join(' ')}
                    >
                      <Icon
                        aria-hidden="true"
                        className={[
                          'size-4.5',
                          isActive ? 'text-secondary' : 'text-on-surface',
                        ].join(' ')}
                        stroke={2}
                      />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {activeSection === 'overview' ? (
                <OverviewSection
                  teams={teams}
                  members={members}
                  pendingInvitationsCount={pendingInvitations.length}
                  auditLogs={auditLogs}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  canManage={canManage}
                  createdAt={organization.createdAt}
                  onNavigateSection={handleSectionChange}
                  onOpenCreateTeam={() => setIsCreateTeamOpen(true)}
                  onOpenInvite={() => setIsInviteOpen(true)}
                />
              ) : null}

              {activeSection === 'teams' ? (
                <TeamsSection
                  teams={teams}
                  canManage={canManage}
                  onOpenCreateTeam={() => setIsCreateTeamOpen(true)}
                />
              ) : null}

              {activeSection === 'members' ? (
                <MembersSection
                  members={members}
                  currentUserId={currentUserId}
                  canManage={canManage}
                  onOpenInvite={() => setIsInviteOpen(true)}
                />
              ) : null}

              {activeSection === 'invitations' && canManage ? (
                <InvitationsSection
                  organizationSlug={organization.slug}
                  invitations={pendingInvitations}
                  renderedAt={renderedAt}
                  onOpenInvite={() => setIsInviteOpen(true)}
                />
              ) : null}

              {activeSection === 'audit' && canManage ? (
                <AuditSection auditLogs={auditEntries} />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {isCreateTeamOpen ? (
        <CreateTeamModal
          organizationSlug={organization.slug}
          organizationName={organization.name}
          onClose={closeCreateTeam}
        />
      ) : null}

      {isInviteOpen ? (
        <InviteMemberModal
          organizationSlug={organization.slug}
          organizationName={organization.name}
          onClose={closeInvite}
        />
      ) : null}
    </div>
  );
}
