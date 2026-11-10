import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import type { Notification, UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ListNotificationsDto } from './dto/list-notifications.dto.js';
import { NotificationsService } from './notifications.service.js';

/* /me/...: rutas del usuario autenticado (sin organización al medio).
 * La autorización entera vive en el service: el userId sale del token. */
@Controller('me')
export class NotificationsController {
  public constructor(private readonly notifications: NotificationsService) {}

  @Get('notifications')
  public list(
    @CurrentUser() user: UserSummary,
    @Query() query: ListNotificationsDto,
  ): Promise<Notification[]> {
    return this.notifications.listMine(user.id, query.unread === true);
  }

  @Patch('notifications/:notificationId/read')
  @HttpCode(HttpStatus.OK)
  public markRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Notification> {
    return this.notifications.markRead(user.id, notificationId);
  }
}
