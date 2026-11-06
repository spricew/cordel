import { Module } from '@nestjs/common';
import { SubtasksController } from './subtasks.controller.js';
import { SubtasksService } from './subtasks.service.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  controllers: [TasksController, SubtasksController],
  providers: [TasksService, SubtasksService],
})
export class TasksModule {}
