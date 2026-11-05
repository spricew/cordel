import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { Task, UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RequirePermission } from '../roles/require-permission.decorator.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

/* Tarea: anidada bajo su equipo de DOS slugs (org + equipo).
 * Las escrituras declaran permiso (el guard traduce slugs a ids y
 * exige la matriz); las lecturas llevan aislamiento en el service
 * (solo TeamMember del equipo, además del rol). */
@Controller('organizations')
export class TasksController {
  public constructor(private readonly tasks: TasksService) {}

  @RequirePermission('task:create', 'slug', 'teamSlug')
  @Post(':slug/teams/:teamSlug/tasks')
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Body() dto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasks.create(slug, teamSlug, dto);
  }

  @Get(':slug/teams/:teamSlug/tasks')
  public list(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Task[]> {
    return this.tasks.list(slug, teamSlug, user.id);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId')
  public findById(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Task> {
    return this.tasks.findById(slug, teamSlug, user.id, taskId);
  }

  @RequirePermission('task:update', 'slug', 'teamSlug')
  @Patch(':slug/teams/:teamSlug/tasks/:taskId')
  public update(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: UserSummary,
  ): Promise<Task> {
    return this.tasks.update(slug, teamSlug, taskId, dto, user.id);
  }

  @RequirePermission('task:delete', 'slug', 'teamSlug')
  @Delete(':slug/teams/:teamSlug/tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<void> {
    await this.tasks.remove(slug, teamSlug, user.id, taskId);
  }
}
