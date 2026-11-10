import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubtasksController } from './subtasks.controller.js';
import { SubtasksService } from './subtasks.service.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [TasksController, SubtasksController],
  providers: [TasksService, SubtasksService],
})
export class TasksModule {}
