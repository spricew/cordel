import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Notification, NotificationType } from '@cordel/types';

/* Notificaciones del usuario autenticado (GET /me/*): nadie puede ver
 * ni marcar las de otro — el filtro es por userId, sin slugs.
 *
 * Además es el EMISOR de avisos desde otros services (TasksService,
 * SubtasksService): `emit` inserta la fila. Los tipos TASK_DUE_SOON
 * (tarea por vencer) y SUBTASK_BLOCKED llegarán con los jobs/Redis;
 * MEMBER_ADDED con las invitaciones. */
export interface EmitNotificationInput {
  type: NotificationType;
  /* A quien le toca la campanita. El que emite decide saltarse al
   * actor (que no se notifique a sí mismo). */
  userId: string;
  organizationId: string;
  teamId: string | null;
  title: string;
  body: string;
  taskId: string | null;
  subtaskId: string | null;
}

@Injectable()
export class NotificationsService {
  public constructor(private readonly prisma: PrismaService) {}

  private toNotification(row: {
    id: string;
    organizationId: string;
    teamId: string | null;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    taskId: string | null;
    subtaskId: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): Notification {
    return {
      id: row.id,
      organizationId: row.organizationId,
      teamId: row.teamId,
      userId: row.userId,
      type: row.type,
      title: row.title,
      body: row.body,
      taskId: row.taskId,
      subtaskId: row.subtaskId,
      readAt: row.readAt === null ? null : row.readAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  // Emisión: la llamada en un service corría su op principal y luego
  // deja el aviso. Si la fila no nace, la operación entera falla —
  // misma semántica de "todo o nada" que el resto del módulo.
  public async emit(input: EmitNotificationInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        type: input.type,
        userId: input.userId,
        organizationId: input.organizationId,
        teamId: input.teamId,
        title: input.title,
        body: input.body,
        taskId: input.taskId,
        subtaskId: input.subtaskId,
      },
    });
  }

  public async listMine(userId: string, unreadOnly: boolean): Promise<Notification[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toNotification(row));
  }

  public async markRead(userId: string, notificationId: string): Promise<Notification> {
    // 404 idéntico si no existe O si no es tuya: no filtrar existencia.
    const row = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (row === null || row.userId !== userId) {
      throw new NotFoundException('Notificación no encontrada');
    }
    // Idempotente: marcar dos veces no rompe, solo devuelve tal cual.
    if (row.readAt !== null) {
      return this.toNotification(row);
    }
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return this.toNotification(updated);
  }
}
