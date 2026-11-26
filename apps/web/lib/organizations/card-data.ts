import type { OrganizationOverview } from '@cordel/types';

import type { OrganizationCardData } from '@components/organizations/types';

import { accentFor } from './presentation';

/** Adapta la respuesta de la API a la forma que consume el explorador. */
export function toOrganizationCardData(organization: OrganizationOverview): OrganizationCardData {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    role: organization.role,
    members: organization.memberCount,
    teams: organization.teamCount,
    createdAt: organization.createdAt,
    accent: accentFor(organization.slug),
  };
}
