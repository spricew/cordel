import { cache } from 'react';
import type {
  AuditAction,
  AuditLog,
  Invitation,
  MembershipWithUser,
  Organization,
  Role,
  Team,
  UserSummary,
} from '@cordel/types';

import { authFetch } from '@/lib/api';

export interface OrganizationDetailData {
  organization: Organization;
  currentUserId: string;
  currentUserRole: Role;
  canManage: boolean;
  teams: Team[];
  members: MembershipWithUser[];
  invitations: Invitation[] | null;
  auditLogs: AuditLog[] | null;
  renderedAt: number;
}

export type GetOrganizationDetailResult =
  | { readonly ok: true; readonly data: OrganizationDetailData }
  | {
      readonly ok: false;
      readonly reason: 'unauthorized' | 'not-found' | 'unavailable' | 'invalid-response';
    };

type FetchJsonResult<T> =
  | { readonly ok: true; readonly data: T }
  | {
      readonly ok: false;
      readonly reason:
        'unauthorized' | 'not-found' | 'forbidden' | 'unavailable' | 'invalid-response';
    };

async function fetchTyped<T>(
  path: string,
  guard: (value: unknown) => value is T,
): Promise<FetchJsonResult<T>> {
  const result = await authFetch(path);

  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason === 'no-session' ? 'unauthorized' : 'unavailable',
    };
  }

  if (result.response.status === 401) {
    return { ok: false, reason: 'unauthorized' };
  }

  if (result.response.status === 403) {
    return { ok: false, reason: 'forbidden' };
  }

  if (result.response.status === 404) {
    return { ok: false, reason: 'not-found' };
  }

  if (!result.response.ok) {
    return { ok: false, reason: 'unavailable' };
  }

  let payload: unknown;

  try {
    payload = await result.response.json();
  } catch {
    return { ok: false, reason: 'invalid-response' };
  }

  if (!guard(payload)) {
    return { ok: false, reason: 'invalid-response' };
  }

  return { ok: true, data: payload };
}

/**
 * Carga la organización por slug junto con sus equipos, miembros y,
 * cuando el usuario tiene rol OWNER o ADMIN, invitaciones y auditoría.
 * `cache()` evita duplicar peticiones entre `generateMetadata` y la página.
 */
export const getOrganizationDetail = cache(
  async (orgSlug: string, currentUserId: string): Promise<GetOrganizationDetailResult> => {
    const encodedSlug = encodeURIComponent(orgSlug);

    const [orgResult, teamsResult, membersResult] = await Promise.all([
      fetchTyped(`/api/v1/organizations/${encodedSlug}`, isOrganization),
      fetchTyped(`/api/v1/organizations/${encodedSlug}/teams`, isTeamList),
      fetchTyped(`/api/v1/organizations/${encodedSlug}/members`, isMembershipWithUserList),
    ]);

    const primaryFailure = [orgResult, teamsResult, membersResult].find((res) => !res.ok);

    if (primaryFailure !== undefined && !primaryFailure.ok) {
      if (primaryFailure.reason === 'unauthorized') {
        return { ok: false, reason: 'unauthorized' };
      }
      if (primaryFailure.reason === 'not-found') {
        return { ok: false, reason: 'not-found' };
      }
      if (primaryFailure.reason === 'invalid-response') {
        return { ok: false, reason: 'invalid-response' };
      }
      return { ok: false, reason: 'unavailable' };
    }

    if (!orgResult.ok || !teamsResult.ok || !membersResult.ok) {
      return { ok: false, reason: 'unavailable' };
    }

    const organization = orgResult.data;
    const members = membersResult.data;
    const currentMembership = members.find((member) => member.userId === currentUserId);
    const currentUserRole: Role =
      currentMembership?.role ?? (organization.ownerId === currentUserId ? 'OWNER' : 'MEMBER');
    const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

    let invitations: Invitation[] | null = null;
    let auditLogs: AuditLog[] | null = null;

    if (canManage) {
      const [invitationsResult, auditResult] = await Promise.all([
        fetchTyped(`/api/v1/organizations/${encodedSlug}/invitations`, isInvitationList),
        fetchTyped(`/api/v1/organizations/${encodedSlug}/audit-logs?limit=30`, isAuditLogList),
      ]);

      if (invitationsResult.ok) {
        invitations = invitationsResult.data;
      } else if (invitationsResult.reason === 'unauthorized') {
        return { ok: false, reason: 'unauthorized' };
      }

      if (auditResult.ok) {
        auditLogs = auditResult.data;
      } else if (auditResult.reason === 'unauthorized') {
        return { ok: false, reason: 'unauthorized' };
      }
    }

    return {
      ok: true,
      data: {
        organization,
        currentUserId,
        currentUserRole,
        canManage,
        teams: teamsResult.data,
        members,
        invitations,
        auditLogs,
        renderedAt: Date.now(),
      },
    };
  },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRole(value: unknown): value is Role {
  return value === 'OWNER' || value === 'ADMIN' || value === 'MEMBER';
}

function isUserSummary(value: unknown): value is UserSummary {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.email === 'string' &&
    typeof value.name === 'string'
  );
}

function isOrganization(value: unknown): value is Organization {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.ownerId === 'string' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isTeam(value: unknown): value is Team {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.organizationId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slug === 'string' &&
    (value.description === null || typeof value.description === 'string') &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function isTeamList(value: unknown): value is Team[] {
  return Array.isArray(value) && value.every(isTeam);
}

function isMembershipWithUser(value: unknown): value is MembershipWithUser {
  if (!isRecord(value)) return false;

  return (
    typeof value.userId === 'string' &&
    typeof value.organizationId === 'string' &&
    isRole(value.role) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    isUserSummary(value.user)
  );
}

function isMembershipWithUserList(value: unknown): value is MembershipWithUser[] {
  return Array.isArray(value) && value.every(isMembershipWithUser);
}

function isInvitation(value: unknown): value is Invitation {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.organizationId === 'string' &&
    typeof value.email === 'string' &&
    isRole(value.role) &&
    typeof value.invitedById === 'string' &&
    (value.acceptedAt === null || typeof value.acceptedAt === 'string') &&
    (value.revokedAt === null || typeof value.revokedAt === 'string') &&
    typeof value.expiresAt === 'string' &&
    typeof value.sentAt === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isInvitationList(value: unknown): value is Invitation[] {
  return Array.isArray(value) && value.every(isInvitation);
}

const AUDIT_ACTIONS: readonly AuditAction[] = [
  'ORG_CREATED',
  'TEAM_CREATED',
  'INVITATION_CREATED',
  'INVITATION_RESENT',
  'INVITATION_REVOKED',
  'MEMBER_JOINED',
];

function isAuditAction(value: unknown): value is AuditAction {
  return typeof value === 'string' && AUDIT_ACTIONS.includes(value as AuditAction);
}

function isAuditLog(value: unknown): value is AuditLog {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'string' &&
    typeof value.organizationId === 'string' &&
    isUserSummary(value.actor) &&
    isAuditAction(value.action) &&
    typeof value.entityType === 'string' &&
    typeof value.entityId === 'string' &&
    (value.metadata === null || isRecord(value.metadata)) &&
    typeof value.createdAt === 'string'
  );
}

function isAuditLogList(value: unknown): value is AuditLog[] {
  return Array.isArray(value) && value.every(isAuditLog);
}
