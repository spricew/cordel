import type { Role } from '@cordel/types';

/** Filtros disponibles en el directorio de organizaciones. */
export type OrganizationFilter = 'all' | 'owned' | 'team';

/** Tintes suaves para el monograma de cada organización. */
export type OrganizationAccent = 'sage' | 'slate' | 'clay' | 'sand' | 'moss';

export interface OrganizationCardData {
  id: string;
  name: string;
  slug: string;
  role: Role;
  members: number;
  teams: number;
  createdAt: string;
  accent: OrganizationAccent;
}
