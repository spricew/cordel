import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { InvitationsController } from './invitations.controller.js';
import { InvitationsService } from './invitations.service.js';

@Module({
  imports: [NotificationsModule], // MEMBER_ADDED al aceptar
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
