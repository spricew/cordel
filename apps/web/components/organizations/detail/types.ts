import {
  IconActivity,
  IconLayoutGrid,
  IconMailForward,
  IconUsers,
  IconUsersGroup,
  type Icon,
} from '@tabler/icons-react';

export type OrgSection = 'overview' | 'teams' | 'members' | 'invitations' | 'audit';

export interface OrgNavItem {
  id: OrgSection;
  label: string;
  icon: Icon;
  adminOnly: boolean;
}

export const ORG_NAV_ITEMS: readonly OrgNavItem[] = [
  { id: 'overview', label: 'Resumen', icon: IconLayoutGrid, adminOnly: false },
  { id: 'teams', label: 'Equipos', icon: IconUsersGroup, adminOnly: false },
  { id: 'members', label: 'Miembros', icon: IconUsers, adminOnly: false },
  { id: 'invitations', label: 'Invitaciones', icon: IconMailForward, adminOnly: true },
  { id: 'audit', label: 'Actividad', icon: IconActivity, adminOnly: true },
];

export function isValidOrgSection(
  value: string | undefined,
  canManage: boolean,
): value is OrgSection {
  if (value === undefined) return false;

  const item = ORG_NAV_ITEMS.find((candidate) => candidate.id === value);
  if (item === undefined) return false;

  return !item.adminOnly || canManage;
}
