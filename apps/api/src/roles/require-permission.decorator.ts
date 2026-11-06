import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@cordel/types';

export const PERMISSION_KEY = 'requirePermission';

export interface RequirePermissionMetadata {
  permission: Permission;
  /** Nombre del param de ruta con el slug de la organización. */
  organizationSlugParam: string;
  /** Nombre del param de ruta con el slug del equipo (solo si la
   * acción vive DENTRO de un equipo; team:create va sin esto). */
  teamSlugParam?: string;
  /** Nombre del param de ruta con el id de la tarea sobre la que recae
   * la acción (permisos subtask:*). Habilita la concesión condicional
   * de ADR 002: el responsable de la tarea segmenta aunque sea MEMBER. */
  taskIdParam?: string;
}

/* Marca una ruta con el permiso que exige. Los params de ruta nombran
 * dónde vienen los slugs; el PermissionGuard los traduce a ids. */
export const RequirePermission = (
  permission: Permission,
  organizationSlugParam: string,
  teamSlugParam?: string,
  taskIdParam?: string,
): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSION_KEY, {
    permission,
    organizationSlugParam,
    teamSlugParam,
    taskIdParam,
  } satisfies RequirePermissionMetadata);
