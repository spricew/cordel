import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { EffectivePermissions, Permission } from '@cordel/types';
import { RolesService } from './roles.service.js';

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
  ): Promise<EffectivePermissions> {
    const resolved = await this.roles.resolve(userId, organizationId, teamId);
    if (resolved === null) {
      // No miembro → mismo mensaje que una org fantasma: no se filtra
      // qué organizaciones existen.
      throw new NotFoundException('Organización no encontrada');
    }
    if (!resolved.permissions.includes(permission)) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    return resolved;
  }
}
