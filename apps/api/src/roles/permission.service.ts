import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { EffectivePermissions, Permission } from '@cordel/types';
import { RolesService } from './roles.service.js';

/* Permisos de subtarea: además de OWNER/ADMIN por matriz, ADR 002 define
 * la concesión condicional "solo las tareas que tiene asignadas": el
 * responsable de la tarea puede segmentarla aunque su rol sea MEMBER.
 * Esa regla vive AQUÍ (por recurso), no en la matriz de roles. */
export const SUBTASK_PERMISSIONS: Permission[] = ['subtask:create', 'subtask:update'];

/* Referencia mínima a la tarea sobre la que recae una acción.
 * Solo lo que la regla condicional necesita saber. */
export interface TaskRef {
  assigneeId: string | null;
}

/* Decide si un usuario puede hacer una acción. Es la capa de REGLAS;
 * RolesService es la capa de DATOS (resolver el rol + la matriz).
 * El guard traduce los slugs de ruta a ids y aquí se ejecuta la regla. */
@Injectable()
export class PermissionService {
  public constructor(private readonly roles: RolesService) {}

  public async assert(
    userId: string,
    organizationId: string,
    teamId: string | null,
    permission: Permission,
    task?: TaskRef,
  ): Promise<EffectivePermissions> {
    const resolved = await this.roles.resolve(userId, organizationId, teamId);
    if (resolved === null) {
      // No miembro → mismo mensaje que una org fantasma: no se filtra
      // qué organizaciones existen.
      throw new NotFoundException('Organización no encontrada');
    }
    if (resolved.permissions.includes(permission)) {
      return resolved;
    }
    // Concesión condicional (ADR 002): segmentar la tarea es cosa del
    // responsable, incluso si su rol es MEMBER. Solo aplica con tarea en
    // contexto — nunca a nivel organización ni para acciones task:*.
    if (
      task !== undefined &&
      task.assigneeId === userId &&
      SUBTASK_PERMISSIONS.includes(permission)
    ) {
      return resolved;
    }
    throw new ForbiddenException('No tienes permiso para esta acción');
  }
}
