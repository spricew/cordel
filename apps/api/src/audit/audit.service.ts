import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuditAction, AuditLog } from '@cordel/types';

/* Registro de auditoría: insert puro, sin "todo o nada". A diferencia
 * de NotificationsService.emit, aquí un fallo de escritura NO debe
 * tumbar la operación de negocio que lo generó (crear la organización
 * es más importante que su bitácora): se loguea y se sigue. El costo
 * es aceptable — la auditoría es observabilidad, no invariant. */
export interface RecordAuditInput {
  action: AuditAction;
  actorId: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  public constructor(private readonly prisma: PrismaService) {}

  public async record(input: RecordAuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: input.action,
          actorId: input.actorId,
          organizationId: input.organizationId,
          entityType: input.entityType,
          entityId: input.entityId,
          // Json nulo en Prisma 7: omitir el campo (= NULL en la base).
          metadata:
            input.metadata === undefined ? undefined : (input.metadata as Prisma.InputJsonValue),
        },
      });
    } catch (error) {
      // La bitácora nunca bloquea: la acción de negocio ya ocurrió.
      this.logger.error(`No se pudo registrar auditoría (${input.action}): ${String(error)}`);
    }
  }

  public async list(slug: string, limit: number): Promise<AuditLog[]> {
    // Clamp defensivo: el límite llega por query, así que se acota.
    const take = Math.min(Math.max(limit, 1), 100);
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (organization === null) {
      // El guard ya resolvió el slug para autorizar; llegar aquí con
      // null no debería ocurrir, pero mejor 404 honesto.
      throw new NotFoundException('Organización no encontrada');
    }
    const rows = await this.prisma.auditLog.findMany({
      where: { organizationId: organization.id },
      include: { actor: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      actor: row.actor,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
