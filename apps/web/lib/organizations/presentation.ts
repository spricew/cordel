import type { Role } from '@cordel/types';

import type { OrganizationAccent } from '@components/organizations/types';

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const SLUG_MAX_LENGTH = 100;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
};

export const AVATAR_TONES: Record<OrganizationAccent, string> = {
  sage: 'bg-secondary-container text-on-secondary-container',
  slate: 'bg-primary-fixed text-on-primary-fixed-variant',
  clay: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  sand: 'bg-surface-container-high text-on-surface-variant',
  moss: 'bg-secondary-fixed-dim text-on-secondary-fixed-variant',
};

const ACCENTS: readonly OrganizationAccent[] = ['sage', 'slate', 'clay', 'sand', 'moss'];

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function accentFor(seed: string): OrganizationAccent {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return ACCENTS[hash % ACCENTS.length] ?? 'sage';
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

export function formatShortDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'fecha desconocida' : SHORT_DATE_FORMATTER.format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'fecha desconocida' : DATE_TIME_FORMATTER.format(date);
}

/** Quita acentos y normaliza el texto para generar un slug válido. */
export function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH);
}

/**
 * Limpia el slug mientras se escribe, sin recortar los guiones finales,
 * así se puede seguir escribiendo una palabra compuesta.
 */
export function normalizeSlugInput(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, SLUG_MAX_LENGTH);
}
