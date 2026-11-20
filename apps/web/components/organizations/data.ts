import type { OrganizationCardData } from './types';

/**
 * Datos de demostración del directorio.
 *
 * La página está preparada para recibir organizaciones reales desde la API:
 * solo hay que sustituir este arreglo por la respuesta de `GET /organizations`
 * y completar los campos que el listado no devuelve (miembros, equipos y
 * ubicación).
 */
export const DEMO_ORGANIZATIONS: OrganizationCardData[] = [
  {
    id: 'org_ultra_hogar',
    name: 'Ultra Hogar',
    slug: 'ultra-hogar',
    role: 'OWNER',
    members: 48,
    teams: 8,
    location: 'Mérida, Yucatán',
    accent: 'sage',
  },
  {
    id: 'org_norte_estudio',
    name: 'Norte Estudio',
    slug: 'norte-estudio',
    role: 'ADMIN',
    members: 11,
    teams: 3,
    location: 'Ciudad de México',
    accent: 'slate',
  },
  {
    id: 'org_casa_bruma',
    name: 'Casa Bruma',
    slug: 'casa-bruma',
    role: 'MEMBER',
    members: 24,
    teams: 5,
    location: 'Guadalajara, Jalisco',
    accent: 'clay',
  },
  {
    id: 'org_taller_palma',
    name: 'Taller Palma',
    slug: 'taller-palma',
    role: 'OWNER',
    members: 7,
    teams: 2,
    location: 'Oaxaca de Juárez',
    accent: 'sand',
  },
  {
    id: 'org_oficio_colectivo',
    name: 'Oficio Colectivo',
    slug: 'oficio-colectivo',
    role: 'MEMBER',
    members: 32,
    teams: 6,
    location: 'Monterrey, Nuevo León',
    accent: 'moss',
  },
];
