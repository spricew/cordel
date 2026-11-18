import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { REDIS_CONNECTION, SCHEDULER_QUEUE } from './queue.tokens.js';

/* Job programado `scan-due-soon` (cada hora, scheduler repeatable de
 * BullMQ v6: upsertJobScheduler es idempotente — mismo id + mismo
 * patrón no se duplica entre arranques): barrer tareas que vencen
 * dentro de las próximas 24h con responsable y avisar (TASK_DUE_SOON).
 * El "no avisar dos veces" lo resuelve la consulta: si ya existe una
 * notificación TASK_DUE_SOON para esa tarea, se salta. */
@Injectable()
export class DueSoonProcessor implements OnModuleInit, OnModuleDestroy {
  private worker: Worker | null = null;
  private scheduler: Queue | null = null;

  public constructor(
    @Inject(REDIS_CONNECTION) private readonly redis: Redis,
    @Inject(SCHEDULER_QUEUE) private readonly schedulerRef: Queue,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  public onModuleInit(): void {
    this.worker = new Worker(
      'scheduler',
      async (job: Job): Promise<void> => {
        if (job.name !== 'scan-due-soon') {
          throw new Error(`Trabajo programado desconocido: ${job.name}`);
        }
        await this.scan();
      },
      { connection: this.redis },
    );
    this.scheduler = this.schedulerRef;
    void this.scheduler
      .upsertJobScheduler(
        'scan-due-soon',
        { pattern: '0 * * * *' },
        {
          name: 'scan-due-soon',
          data: {},
          opts: { removeOnComplete: { count: 1 }, removeOnFail: { count: 1 } },
        },
      )
      .catch(() => undefined);
  }

  public async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private async scan(): Promise<number> {
    const now = Date.now();
    const in24h = new Date(now + 24 * 60 * 60 * 1000);
    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: { not: null, lte: in24h, gte: new Date(now) },
        assigneeId: { not: null },
        status: { not: 'DONE' },
      },
    });

    let sent = 0;
    for (const task of tasks) {
      if (task.assigneeId === null) continue;
      const existing = await this.prisma.notification.findFirst({
        where: { taskId: task.id, type: 'TASK_DUE_SOON', userId: task.assigneeId },
      });
      if (existing !== null) continue;
      await this.notifications.emit({
        type: 'TASK_DUE_SOON',
        userId: task.assigneeId,
        organizationId: task.organizationId,
        teamId: task.teamId,
        title: 'Una tarea tuya vence pronto',
        body: `${task.title} vence el ${task.dueDate?.toISOString() ?? ''}`,
        taskId: task.id,
        subtaskId: null,
      });
      sent += 1;
    }
    return sent;
  }
}
