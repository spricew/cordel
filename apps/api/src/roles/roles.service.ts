import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { EffectivePermissions, Permission, Role } from '@cordel/types';

/* Matriz ADR 002: rol → permisos. Espeja la tabla del ADR; añadir un
 * permiso nuevo es tocar este arreglo y el union de @cordel/types —
 * no condicionales repartidos por el código.
 * MEMBER sale vacío a propósito: sus concesiones condicionales
 * ("solo las tareas que tiene asignadas") se evalúan por recurso, no aquí. */
export const ALL_PERMISSIONS: Permission[] = [
  'organization:update',
  'organization:delete',
  'member:invite',
  'member:remove',
  'member:update_role',
  'team:create',
  'team:delete',
  'task:create',
  'task:assign',
  'task:update',
  'task:delete',
  'subtask:create',
  'subtask:update',
];

export const PERMISSIONS_BY_ROLE: Record<Role, Permission[]> = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS.filter(
    (permission) =>
      permission !== 'organization:delete' && permission !== 'team:delete',
  ),
  MEMBER: [],
};

// Resuelve el rol efectivo (ADR 002): `TeamMember.role ?? Membership.role`.
// Recibes ids, no slugs: es un resolver interno (de ahí lo usará el RBAC).
// Si no hay Membership NI TeamMember, devuelve null (no es miembro).
@Injectable()
export class RolesService {
  public constructor(private readonly prisma: PrismaService) {}

  public async resolve(
    userId: string,
    organizationId: string,
    teamId: string | null,
  ): Promise<EffectivePermissions | null> {
    const [membership, teamMember] = await Promise.all([
      this.prisma.membership.findFirst({ where: { userId, organizationId } }),
      teamId === null
        ? Promise.resolve(null)
        : this.prisma.teamMember.findFirst({ where: { userId, teamId } }),
    ]);
    if (membership === null && teamMember === null) {
      return null;
    }

    const organizationRole: Role =
      membership?.role ?? teamMember?.role ?? 'MEMBER';
    const teamRole: Role | null = teamMember !== null ? teamMember.role : null;
    const effectiveRole: Role = teamRole ?? organizationRole;

    return {
      organizationRole,
      teamRole,
      effectiveRole,
      permissions: PERMISSIONS_BY_ROLE[effectiveRole],
    };
  }
}
