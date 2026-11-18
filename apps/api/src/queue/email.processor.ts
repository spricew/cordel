import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { MailerService } from '../mail/mailer.service.js';
import { REDIS_CONNECTION } from './queue.tokens.js';
import type { EmailJob } from './email-job.js';

/* Worker de la cola `emails`: procesa cada trabajo una vez (BullMQ
 * garantiza at-least-once; con removeOnComplete no se repiten).
 * Arranca con el módulo y muere con el módulo (onModuleDestroy cierra
 * la conexión bloqueante del worker — obligatorio para terminar limpio). */
@Injectable()
export class EmailProcessor implements OnModuleInit, OnModuleDestroy {
  private worker: Worker | null = null;

  public constructor(
    @Inject(REDIS_CONNECTION) private readonly redis: Redis,
    private readonly mailer: MailerService,
  ) {}

  public onModuleInit(): void {
    this.worker = new Worker<EmailJob>(
      'emails',
      async (job: Job<EmailJob>): Promise<void> => {
        if (job.data.kind !== 'invitation') {
          throw new Error(`Trabajo de email desconocido: ${String(job.data.kind)}`);
        }
        await this.mailer.send(
          job.data.to,
          `Te invitaron a ${job.data.organizationName} en Cordel`,
          `${job.data.inviterName} te invitó a la organización ` +
            `"${job.data.organizationName}" de Cordel.\n\n` +
            'Abre la aplicación, inicia sesión con ESTE email y usa el ' +
            `siguiente código para aceptar:\n\n${job.data.token}\n\n` +
            '(El código vence en 7 días.)',
        );
      },
      { connection: this.redis },
    );
  }

  public async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
