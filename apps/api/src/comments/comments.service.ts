import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';
import type { UpdateCommentDto } from './dto/update-comment.dto.js';
import type { Comment } from '@cordel/types';

/* Comentarios sobre una tarea O sobre una subtarea (nunca ambas: uno de
 * taskId / subtaskId es string y el otro null).
 *
 * Los comentarios NO están en la matriz del ADR 002 (no existe un
 * permiso comment:*): son conversación del equipo. Las reglas son de
 * pertenencia, no de rol:
 * - leer y escribir: ser TeamMember del equipo (aislamiento estricto);
 * - editar o borrar: SOLO el autor de la fila (nadie más, ni OWNER). */
@Injectable()
export class CommentsService {
  public constructor(private readonly prisma: PrismaService) {}

  private toComment(row: {
    id: string;
    organizationId: string;
    teamId: string;
    taskId: string | null;
    subtaskId: string | null;
    authorId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  }): Comment {
    return {
      id: row.id,
      organizationId: row.organizationId,
      teamId: row.teamId,
      taskId: row.taskId,
      subtaskId: row.subtaskId,
      authorId: row.authorId,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /* Cadena de resolución (org 404 → equipo 404 → TeamMember 403),
   * duplicada a propósito como en Task/Subtasks: cada service se basta
   * con su PrismaService. */
  private async assertOrgMembership(orgSlug: string, userId: string): Promise<void> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organization: { slug: orgSlug } },
    });
    if (membership === null) {
      throw new NotFoundException('Organización no encontrada');
    }
  }

  private async resolveTeam(
    orgSlug: string,
    teamSlug: string,
  ): Promise<{ organizationId: string; teamId: string }> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    if (organization === null) {
      throw new NotFoundException('Organización no encontrada');
    }
    const team = await this.prisma.team.findFirst({
      where: { organizationId: organization.id, slug: teamSlug },
    });
    if (team === null) {
      throw new NotFoundException('Equipo no encontrado');
    }
    return { organizationId: organization.id, teamId: team.id };
  }

  private async assertTeamMember(teamId: string, userId: string): Promise<void> {
    const member = await this.prisma.teamMember.findFirst({
      where: { userId, teamId },
    });
    if (member === null) {
      throw new ForbiddenException('No eres miembro de este equipo');
    }
  }

  private async assertOrgTeamMember(
    orgSlug: string,
    teamSlug: string,
    userId: string,
  ): Promise<{ organizationId: string; teamId: string }> {
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    await this.assertTeamMember(teamId, userId);
    return { organizationId, teamId };
  }

  private async findTeamTask(
    organizationId: string,
    teamId: string,
    taskId: string,
  ): Promise<{ id: string }> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, teamId, organizationId },
      select: { id: true },
    });
    if (task === null) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return task;
  }

  private async findTeamSubtask(taskId: string, subtaskId: string): Promise<{ id: string }> {
    const subtask = await this.prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
      select: { id: true },
    });
    if (subtask === null) {
      throw new NotFoundException('Subtarea no encontrada');
    }
    return subtask;
  }

  /* El comentario tiene que colgar de ESTA tarea: directo (taskId) o a
   * través de su subtarea (subtask.taskId). Nunca por solo su id. */
  private async findTaskComment(taskId: string, commentId: string): Promise<Comment> {
    const row = await this.prisma.comment.findFirst({
      where: { id: commentId, OR: [{ taskId }, { subtask: { taskId } }] },
    });
    if (row === null) {
      throw new NotFoundException('Comentario no encontrado');
    }
    return this.toComment(row);
  }

  // Popular el nivel (tarea o subtarea): una fila lleva solo uno.
  private async resolveLevel(
    organizationId: string,
    teamId: string,
    taskId: string,
    subtaskId: string | undefined,
  ): Promise<{ taskId: string | null; subtaskId: string | null }> {
    const task = await this.findTeamTask(organizationId, teamId, taskId);
    if (subtaskId === undefined) {
      return { taskId: task.id, subtaskId: null };
    }
    const subtask = await this.findTeamSubtask(task.id, subtaskId);
    return { taskId: null, subtaskId: subtask.id };
  }

  public async create(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string | undefined,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // Escribir exige ser TeamMember; el rol no interviene aquí.
    const { organizationId, teamId } = await this.assertOrgTeamMember(orgSlug, teamSlug, userId);
    const level = await this.resolveLevel(organizationId, teamId, taskId, subtaskId);

    const row = await this.prisma.comment.create({
      data: {
        organizationId,
        teamId,
        taskId: level.taskId,
        subtaskId: level.subtaskId,
        authorId: userId,
        body: dto.body,
      },
    });
    return this.toComment(row);
  }

  public async list(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string | undefined,
  ): Promise<Comment[]> {
    const { organizationId, teamId } = await this.assertOrgTeamMember(orgSlug, teamSlug, userId);
    const task = await this.findTeamTask(organizationId, teamId, taskId);
    const where: { taskId: string } | { subtaskId: string } =
      subtaskId === undefined
        ? { taskId: task.id }
        : { subtaskId: (await this.findTeamSubtask(task.id, subtaskId)).id };

    const rows = await this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toComment(row));
  }

  public async update(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const { organizationId, teamId } = await this.assertOrgTeamMember(orgSlug, teamSlug, userId);
    await this.findTeamTask(organizationId, teamId, taskId);
    const comment = await this.findTaskComment(taskId, commentId);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Solo el autor puede editar su comentario');
    }

    const row = await this.prisma.comment.update({
      where: { id: commentId },
      data: { body: dto.body },
    });
    return this.toComment(row);
  }

  public async remove(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    commentId: string,
  ): Promise<void> {
    const { organizationId, teamId } = await this.assertOrgTeamMember(orgSlug, teamSlug, userId);
    await this.findTeamTask(organizationId, teamId, taskId);
    const comment = await this.findTaskComment(taskId, commentId);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Solo el autor puede eliminar su comentario');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }
}
