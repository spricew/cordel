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
import type { Comment, UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { CommentsService } from './comments.service.js';

/* Comentarios anidados bajo tarea o subtarea. Sin decorador de
 * permiso: la autorización vive en el service (ser TeamMember para
 * entrar; autor para editar/borrar — el ADR no define comment:*). */
@Controller('organizations')
export class CommentsController {
  public constructor(private readonly comments: CommentsService) {}

  @Post(':slug/teams/:teamSlug/tasks/:taskId/comments')
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: UserSummary,
    @Body() dto: CreateCommentDto,
  ): Promise<Comment> {
    return this.comments.create(slug, teamSlug, user.id, taskId, undefined, dto);
  }

  @Post(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId/comments')
  @HttpCode(HttpStatus.CREATED)
  public createOnSubtask(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: UserSummary,
    @Body() dto: CreateCommentDto,
  ): Promise<Comment> {
    return this.comments.create(slug, teamSlug, user.id, taskId, subtaskId, dto);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId/comments')
  public list(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Comment[]> {
    return this.comments.list(slug, teamSlug, user.id, taskId, undefined);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId/comments')
  public listOnSubtask(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Comment[]> {
    return this.comments.list(slug, teamSlug, user.id, taskId, subtaskId);
  }

  @Patch(':slug/teams/:teamSlug/tasks/:taskId/comments/:commentId')
  public update(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: UserSummary,
    @Body() dto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.comments.update(slug, teamSlug, user.id, taskId, commentId, dto);
  }

  @Delete(':slug/teams/:teamSlug/tasks/:taskId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<void> {
    await this.comments.remove(slug, teamSlug, user.id, taskId, commentId);
  }
}
