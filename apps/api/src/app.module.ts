import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { envSchema } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { AttachmentsModule } from './attachments/attachments.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { RolesModule } from './roles/roles.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { HealthModule } from './health/health.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TeamsModule } from './teams/teams.module.js';

@Module({
  imports: [
    // Lee el .env una vez, lo valida con Zod y lo deja disponible global.
    // Si el .env está mal, la API no arranca.
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    PrismaModule,
    RolesModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    TeamsModule,
    TasksModule,
    CommentsModule,
    AttachmentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
