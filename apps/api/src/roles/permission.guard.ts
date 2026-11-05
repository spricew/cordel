import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@cordel/types';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedRequest } from '../auth/session.guard.js';
import { PERMISSION_KEY, type RequirePermissionMetadata } from './require-permission.decorator.js';
import { PermissionService } from './permission.service.js';

/* Segundo guard global (después de SessionGuard): si la ruta declara
 * @RequirePermission, traduce slugs de ruta a ids y delega la regla
 * al PermissionService. Rutas sin el decorador pasan intactas. */
@Injectable()
export class PermissionGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<RequirePermissionMetadata>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (meta === undefined) {
      return true;
    }

    // SessionGuard corre primero; sin user no debería llegarse nunca aquí.
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user === undefined) {
      throw new UnauthorizedException('Sesión inválida o vencida');
    }

    const params = request.params as Record<string, string>;

    // Slug de organización → fila: org inexistente y org ajena reciben
    // 404 al nivel del PermissionService (mismo mensaje, sin fugas).
    const organization = await this.prisma.organization.findUnique({
      where: { slug: params[meta.organizationSlugParam] },
    });
    if (organization === null) {
      throw new NotFoundException('Organización no encontrada');
    }

    let teamId: string | null = null;
    if (meta.teamSlugParam !== undefined) {
      // Slug de equipo único DENTRO de la organización
      // (@@unique([organizationId, slug])): la pregunta lleva el par.
      const team = await this.prisma.team.findFirst({
        where: {
          organizationId: organization.id,
          slug: params[meta.teamSlugParam],
        },
      });
      if (team === null) {
        throw new NotFoundException('Equipo no encontrado');
      }
      teamId = team.id;
    }

    await this.permissions.assert(
      request.user.id,
      organization.id,
      teamId,
      meta.permission satisfies Permission,
    );
    return true;
  }
}
