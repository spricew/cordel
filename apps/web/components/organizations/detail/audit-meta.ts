import {
  IconBuildingPlus,
  IconMailCancel,
  IconMailForward,
  IconRefresh,
  IconUserPlus,
  IconUsersPlus,
  type Icon,
} from '@tabler/icons-react';
import type { AuditAction, AuditLog, Role } from '@cordel/types';

import { ROLE_LABELS } from '@/lib/organizations/presentation';

export interface AuditEventMeta {
  label: string;
  icon: Icon;
  tone: string;
  category: 'teams' | 'members';
}

export const AUDIT_EVENT_META: Record<AuditAction, AuditEventMeta> = {
  ORG_CREATED: {
    label: 'Organización creada',
    icon: IconBuildingPlus,
    tone: 'bg-secondary-container/70 text-secondary',
    category: 'teams',
  },
  TEAM_CREATED: {
    label: 'Equipo creado',
    icon: IconUsersPlus,
    tone: 'bg-primary-fixed text-on-primary-fixed-variant',
    category: 'teams',
  },
  INVITATION_CREATED: {
    label: 'Invitación enviada',
    icon: IconMailForward,
    tone: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    category: 'members',
  },
  INVITATION_REVOKED: {
    label: 'Invitación revocada',
    icon: IconMailCancel,
    tone: 'bg-surface-container-high text-muted',
    category: 'members',
  },
  INVITATION_RESENT: {
    label: 'Invitación reenviada',
    icon: IconRefresh,
    tone: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
    category: 'members',
  },
  MEMBER_JOINED: {
    label: 'Nuevo miembro incorporado',
    icon: IconUserPlus,
    tone: 'bg-chip-in-review text-chip-in-review-text',
    category: 'members',
  },
};

export function formatAuditDetail(entry: AuditLog): string | null {
  const metadata = entry.metadata;
  if (metadata === null) return null;

  const parts: string[] = [];

  if (typeof metadata.name === 'string' && metadata.name.trim() !== '') {
    parts.push(metadata.name);
  }

  if (typeof metadata.slug === 'string' && metadata.slug.trim() !== '') {
    parts.push(`/${metadata.slug}`);
  }

  if (typeof metadata.email === 'string' && metadata.email.trim() !== '') {
    parts.push(metadata.email);
  }

  if (metadata.role === 'OWNER' || metadata.role === 'ADMIN' || metadata.role === 'MEMBER') {
    parts.push(ROLE_LABELS[metadata.role as Role]);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
