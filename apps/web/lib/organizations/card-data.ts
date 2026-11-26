import type { OrganizationOverview } from '@cordel/types';

import type { OrganizationAccent, OrganizationCardData } from '@components/organizations/types';

const ACCENTS: readonly OrganizationAccent[] = ['sage', 'slate', 'clay', 'sand', 'moss'];

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

// El tinte del monograma se deriva del slug para que no cambie entre
// visitas ni dependa del orden en que llegan las organizaciones.
function accentFor(slug: string): OrganizationAccent {
  let hash = 0;

  for (const character of slug) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return ACCENTS[hash % ACCENTS.length] ?? 'sage';
}
