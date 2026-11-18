import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { MailerService } from '../mail/mailer.service.js';
import { DueSoonProcessor } from './due-soon.processor.js';
import { EmailProcessor } from './email.processor.js';
import { RateLimitService } from './rate-limit.service.js';
import { EMAIL_QUEUE, REDIS_CONNECTION, SCHEDULER_QUEUE } from './queue.tokens.js';

/* Infraestructura de trabajos: Redis (conexión) + BullMQ (dos colas:
 * `emails` — trabajos de envío — y `scheduler` — el job repeatable de
 * tareas por vencer) + rate limiting del login. La lógica de CADA
 * trabajo vive en su processor; los services de dominio (invitations,
 * tasks, subtasks) solo ENCOLAN o EMITEN. */
@Global()
@Module({
  imports: [NotificationsModule],
  providers: [
    {
      provide: REDIS_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis =>
        new Redis(config.getOrThrow<string>('REDIS_URL'), {
          maxRetriesPerRequest: null,
        }),
    },
    {
      provide: EMAIL_QUEUE,
      inject: [REDIS_CONNECTION],
      useFactory: (redis: Redis): Queue => new Queue('emails', { connection: redis }),
    },
    {
      provide: SCHEDULER_QUEUE,
      inject: [REDIS_CONNECTION],
      useFactory: (redis: Redis): Queue => new Queue('scheduler', { connection: redis }),
    },
    MailerService,
    EmailProcessor,
    DueSoonProcessor,
    RateLimitService,
  ],
  exports: [REDIS_CONNECTION, EMAIL_QUEUE, SCHEDULER_QUEUE, MailerService, RateLimitService],
})
export class QueueModule {}
