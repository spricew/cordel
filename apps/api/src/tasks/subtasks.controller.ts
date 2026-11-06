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
import type { Subtask, SubtaskDependency, UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RequirePermission } from '../roles/require-permission.decorator.js';
import { CreateSubtaskDto } from './dto/create-subtask.dto.js';
import { UpdateSubtaskDto } from './dto/update-subtask.dto.js';
import { CreateDependencyDto } from './dto/create-dependency.dto.js';
import { SubtasksService } from './subtasks.service.js';

/* Subtareas: anidadas bajo TRES keys de ruta — org, equipo y tarea.
 * Las escrituras declaran @RequirePermission subtask:* CON taskId: ahí
 * vive la concesión condicional del responsable (ADR 002). Lecturas sin
 * decorador: aislamiento en el service (TeamMember del equipo). */
/* Nota de decisión: la matriz del ADR no define `subtask:delete`; el
 * DELETE usa la MISMA regla que el PATCH (`subtask:update` + escape del
 * responsable) — quien puede editar una subtarea puede quitarla. */
@Controller('organizations')
export class SubtasksController {
  public constructor(private readonly subtasks: SubtasksService) {}

  @RequirePermission('subtask:create', 'slug', 'teamSlug', 'taskId')
  @Post(':slug/teams/:teamSlug/tasks/:taskId/subtasks')
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateSubtaskDto,
    @CurrentUser() user: UserSummary,
  ): Promise<Subtask> {
    return this.subtasks.create(slug, teamSlug, user.id, taskId, dto);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId/subtasks')
  public list(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Subtask[]> {
    return this.subtasks.list(slug, teamSlug, user.id, taskId);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId')
  public findById(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Subtask> {
    return this.subtasks.findById(slug, teamSlug, user.id, taskId, subtaskId);
  }

  @RequirePermission('subtask:update', 'slug', 'teamSlug', 'taskId')
  @Patch(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId')
  public update(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
    @CurrentUser() user: UserSummary,
  ): Promise<Subtask> {
    return this.subtasks.update(slug, teamSlug, user.id, taskId, subtaskId, dto);
  }

  @RequirePermission('subtask:update', 'slug', 'teamSlug', 'taskId')
  @Delete(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<void> {
    await this.subtasks.remove(slug, teamSlug, user.id, taskId, subtaskId);
  }

  /* Dependencias (tabla SubtaskDependency): mismas reglas que el PATCH. */
  @RequirePermission('subtask:update', 'slug', 'teamSlug', 'taskId')
  @Post(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId/dependencies')
  @HttpCode(HttpStatus.CREATED)
  public addDependency(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: CreateDependencyDto,
    @CurrentUser() user: UserSummary,
  ): Promise<SubtaskDependency> {
    return this.subtasks.addDependency(slug, teamSlug, user.id, taskId, subtaskId, dto);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId/dependencies')
  public listDependencies(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<SubtaskDependency[]> {
    return this.subtasks.listDependencies(slug, teamSlug, user.id, taskId, subtaskId);
  }

  @RequirePermission('subtask:update', 'slug', 'teamSlug', 'taskId')
  @Delete(
    ':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId/dependencies/:dependsOnSubtaskId',
  )
  @HttpCode(HttpStatus.NO_CONTENT)
  public async removeDependency(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @Param('dependsOnSubtaskId') dependsOnSubtaskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<void> {
    await this.subtasks.removeDependency(
      slug,
      teamSlug,
      user.id,
      taskId,
      subtaskId,
      dependsOnSubtaskId,
    );
  }
}
