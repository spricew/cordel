import type { Response } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Attachment, UserSummary } from '@cordel/types';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreateAttachmentDto } from './dto/create-attachment.dto.js';
import { AttachmentsService } from './attachments.service.js';

/* Adjuntos anidados bajo tarea o subtarea; sin decorador de permiso:
 * la autorización vive en el service (TeamMember; borrar solo el que
 * subió). La descarga de un adjunto de subtarea se sirve por la ruta
 * de la tarea padre: el service filtra por el árbol (taskId O
 * subtask.taskId), igual que los comentarios. */
@Controller('organizations')
export class AttachmentsController {
  public constructor(private readonly attachments: AttachmentsService) {}

  @Post(':slug/teams/:teamSlug/tasks/:taskId/attachments')
  @HttpCode(HttpStatus.CREATED)
  public create(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: UserSummary,
    @Body() dto: CreateAttachmentDto,
  ): Promise<Attachment> {
    return this.attachments.create(slug, teamSlug, user.id, taskId, undefined, dto);
  }

  @Post(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId/attachments')
  @HttpCode(HttpStatus.CREATED)
  public createOnSubtask(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: UserSummary,
    @Body() dto: CreateAttachmentDto,
  ): Promise<Attachment> {
    return this.attachments.create(slug, teamSlug, user.id, taskId, subtaskId, dto);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId/attachments')
  public list(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Attachment[]> {
    return this.attachments.list(slug, teamSlug, user.id, taskId, undefined);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId/subtasks/:subtaskId/attachments')
  public listOnSubtask(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('subtaskId') subtaskId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<Attachment[]> {
    return this.attachments.list(slug, teamSlug, user.id, taskId, subtaskId);
  }

  @Get(':slug/teams/:teamSlug/tasks/:taskId/attachments/:attachmentId/download')
  public async download(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: UserSummary,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    // passthrough: Nest sigue manejando la respuesta; aquí solo
    // añadimos los headers del archivo y devolvemos el stream.
    const file = await this.attachments.download(slug, teamSlug, user.id, taskId, attachmentId);
    response.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
    });
    return new StreamableFile(file.bytes);
  }

  @Delete(':slug/teams/:teamSlug/tasks/:taskId/attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param('slug') slug: string,
    @Param('teamSlug') teamSlug: string,
    @Param('taskId') taskId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: UserSummary,
  ): Promise<void> {
    await this.attachments.remove(slug, teamSlug, user.id, taskId, attachmentId);
  }
}
