import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { InvitationsController } from './invitations.controller.js';
import { InvitationsService } from './invitations.service.js';

@Module({
  imports: [NotificationsModule, AuditModule], // MEMBER_ADDED + auditoría
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
