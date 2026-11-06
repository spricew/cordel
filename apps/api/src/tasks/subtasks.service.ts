import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSubtaskDto } from './dto/create-subtask.dto.js';
import type { UpdateSubtaskDto } from './dto/update-subtask.dto.js';
import type { CreateDependencyDto } from './dto/create-dependency.dto.js';
import type { Subtask, SubtaskDependency } from '@cordel/types';

/* Subtareas: los pasos de una tarea. La autorización de escritura vive
 * en el PermissionGuard (@RequirePermission subtask:* CON taskId — el
 * responsable de la tarea puede aunque sea MEMBER, ADR 002); aquí viven
 * los DATOS y las reglas de recurso:
 * - bloqueo: status BLOCKED exige motivo y fija blockedAt;
 * - dependencias: no se puede iniciar hasta que las DONE;
 * - position: orden secuencial dentro de la tarea. */
@Injectable()
export class SubtasksService {
  public constructor(private readonly prisma: PrismaService) {}

  private toSubtask(subtask: {
    id: string;
    taskId: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    blockedReason: string | null;
    blockedAt: Date | null;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }): Subtask {
    return {
      id: subtask.id,
      taskId: subtask.taskId,
      title: subtask.title,
      description: subtask.description,
      status: subtask.status as Subtask['status'],
      priority: subtask.priority as Subtask['priority'],
      dueDate: subtask.dueDate !== null ? subtask.dueDate.toISOString() : null,
      blockedReason: subtask.blockedReason,
      blockedAt: subtask.blockedAt !== null ? subtask.blockedAt.toISOString() : null,
      position: subtask.position,
      createdAt: subtask.createdAt.toISOString(),
      updatedAt: subtask.updatedAt.toISOString(),
    };
  }

  /* Cadena de resolución idéntica a la de TasksService (org → equipo →
   * tarea): 404 en fantasma y ajena, sin filtrar existencia. Duplicada
   * a propósito: cada service se basta con su PrismaService. */
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

  // Aislamiento estricto por equipo (ADR 002): leer subtareas exige
  // ser TeamMember; el rol de la organización NO alcanza.
  private async assertTeamMember(teamId: string, userId: string): Promise<void> {
    const member = await this.prisma.teamMember.findFirst({
      where: { userId, teamId },
    });
    if (member === null) {
      throw new ForbiddenException('No eres miembro de este equipo');
    }
  }

  private async findTeamTask(
    organizationId: string,
    teamId: string,
    taskId: string,
  ): Promise<{ id: string; assigneeId: string | null }> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, teamId, organizationId },
      select: { id: true, assigneeId: true },
    });
    if (task === null) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return task;
  }

  private async findTeamSubtask(taskId: string, subtaskId: string): Promise<Subtask> {
    const subtask = await this.prisma.subtask.findFirst({
      where: { id: subtaskId, taskId },
    });
    if (subtask === null) {
      throw new NotFoundException('Subtarea no encontrada');
    }
    return this.toSubtask(subtask);
  }

  /* Cadena completa de lectura: org (404) → equipo (404) → TeamMember
   * del equipo (403) → tarea (404) → subtarea (404). */
  private async resolveReadChain(
    orgSlug: string,
    teamSlug: string,
    userId: string,
  ): Promise<{ organizationId: string; teamId: string }> {
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    await this.assertTeamMember(teamId, userId);
    return { organizationId, teamId };
  }

  public async create(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    dto: CreateSubtaskDto,
  ): Promise<Subtask> {
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    const task = await this.findTeamTask(organizationId, teamId, taskId); // 404

    // Regla de bloqueo: crear directamente en BLOCKED exige motivo.
    if (dto.status === 'BLOCKED' && dto.blockedReason === undefined) {
      throw new BadRequestException('Para bloquear hace falta un motivo');
    }

    // position: siguiente orden dentro de la tarea (único en su tarea
    // por convenio, la base no lo exige).
    const last = await this.prisma.subtask.aggregate({
      where: { taskId: task.id },
      _max: { position: true },
    });

    const subtask = await this.prisma.subtask.create({
      data: {
        taskId: task.id,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate === undefined ? undefined : new Date(dto.dueDate),
        blockedReason: dto.blockedReason,
        blockedAt: dto.status === 'BLOCKED' ? new Date() : undefined,
        position: (last._max.position ?? -1) + 1,
      },
    });
    return this.toSubtask(subtask);
  }

  public async list(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
  ): Promise<Subtask[]> {
    const { organizationId, teamId } = await this.resolveReadChain(orgSlug, teamSlug, userId);
    const task = await this.findTeamTask(organizationId, teamId, taskId); // 404

    const subtasks = await this.prisma.subtask.findMany({
      where: { taskId: task.id },
      orderBy: { position: 'asc' },
    });
    return subtasks.map((subtask) => this.toSubtask(subtask));
  }

  public async findById(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string,
  ): Promise<Subtask> {
    const { organizationId, teamId } = await this.resolveReadChain(orgSlug, teamSlug, userId);
    const task = await this.findTeamTask(organizationId, teamId, taskId); // 404
    return this.findTeamSubtask(task.id, subtaskId);
  }

  public async update(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string,
    dto: UpdateSubtaskDto,
  ): Promise<Subtask> {
    // Escritura: guard por matriz/condicional; aquí los datos y reglas.
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    const task = await this.findTeamTask(organizationId, teamId, taskId);
    const current = await this.findTeamSubtask(task.id, subtaskId);

    const data: {
      title?: string;
      description?: string;
      status?: UpdateSubtaskDto['status'];
      priority?: UpdateSubtaskDto['priority'];
      dueDate?: Date | null;
      blockedReason?: string | null;
      blockedAt?: Date | null;
    } = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);

    if (dto.status !== undefined) data.status = dto.status;

    if (dto.status === 'BLOCKED' && current.status !== 'BLOCKED') {
      // ENTRAR en bloqueo: motivo obligatorio (el nuevo o el ya fijado)
      // y blockedAt se estampa aquí, no lo manda el cliente.
      const reason = dto.blockedReason ?? current.blockedReason;
      if (reason === null || reason === '') {
        throw new BadRequestException('Para bloquear hace falta un motivo');
      }
      data.blockedReason = reason;
      data.blockedAt = new Date();
    } else if (dto.blockedReason !== undefined) {
      // Ya bloqueada (o bloqueo nuevo con motivo explícito): ajuste del motivo.
      data.blockedReason = dto.blockedReason;
    }

    if (dto.status !== undefined && current.status === 'BLOCKED' && dto.status !== 'BLOCKED') {
      // SALIR del bloqueo: estado limpio. (La notificación
      // SUBTASK_UNBLOCKED entra con el módulo de notificaciones.)
      data.blockedReason = null;
      data.blockedAt = null;
    }

    if (dto.status === 'IN_PROGRESS') {
      // Regla de dependencias (tabla SubtaskDependency): para INICIAR,
      // todas las subtareas de las que depende tienen que estar DONE.
      const pending = await this.prisma.subtaskDependency.count({
        where: {
          subtaskId: subtaskId,
          dependsOn: { status: { not: 'DONE' } },
        },
      });
      if (pending > 0) {
        throw new BadRequestException('Tiene dependencias sin completar');
      }
    }

    const subtask = await this.prisma.subtask.update({
      where: { id: subtaskId },
      data,
    });
    return this.toSubtask(subtask);
  }

  public async remove(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string,
  ): Promise<void> {
    // Escritura: guard por matriz/condicional (subtask:update rule).
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    const task = await this.findTeamTask(organizationId, teamId, taskId);
    await this.findTeamSubtask(task.id, subtaskId);

    // Las dependencias son FK restrictivas: se quitan en ambas
    // direcciones antes de borrar (resto de FK van con SetNull).
    await this.prisma.$transaction([
      this.prisma.subtaskDependency.deleteMany({ where: { subtaskId } }),
      this.prisma.subtaskDependency.deleteMany({
        where: { dependsOnSubtaskId: subtaskId },
      }),
      this.prisma.subtask.delete({ where: { id: subtaskId } }),
    ]);
  }

  public async addDependency(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string,
    dto: CreateDependencyDto,
  ): Promise<SubtaskDependency> {
    // Escritura: guard por matriz/condicional (subtask:update rule).
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    const task = await this.findTeamTask(organizationId, teamId, taskId);
    await this.findTeamSubtask(task.id, subtaskId);

    if (dto.dependsOnSubtaskId === subtaskId) {
      throw new BadRequestException('Una subtarea no puede depender de sí misma');
    }
    // La dependencia apunta a una subtarea DE LA MISMA TAREA: la
    // pregunta por taskId mezcla fantasma y ajena en un solo 400 sin
    // decir al cliente qué otra subtarea existe.
    const dependsOn = await this.prisma.subtask.findFirst({
      where: { id: dto.dependsOnSubtaskId, taskId: task.id },
    });
    if (dependsOn === null) {
      throw new BadRequestException('La dependencia debe ser una subtarea de la misma tarea');
    }
    const duplicate = await this.prisma.subtaskDependency.findUnique({
      where: {
        subtaskId_dependsOnSubtaskId: {
          subtaskId,
          dependsOnSubtaskId: dto.dependsOnSubtaskId,
        },
      },
    });
    if (duplicate !== null) {
      throw new ConflictException('Esa dependencia ya existe');
    }

    await this.prisma.subtaskDependency.create({
      data: { subtaskId, dependsOnSubtaskId: dto.dependsOnSubtaskId },
    });
    return { subtaskId, dependsOnSubtaskId: dto.dependsOnSubtaskId };
  }

  public async listDependencies(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string,
  ): Promise<SubtaskDependency[]> {
    const { organizationId, teamId } = await this.resolveReadChain(orgSlug, teamSlug, userId);
    const task = await this.findTeamTask(organizationId, teamId, taskId); // 404
    await this.findTeamSubtask(task.id, subtaskId);

    const rows = await this.prisma.subtaskDependency.findMany({
      where: { subtaskId },
    });
    return rows.map((row) => ({
      subtaskId: row.subtaskId,
      dependsOnSubtaskId: row.dependsOnSubtaskId,
    }));
  }

  public async removeDependency(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string,
    dependsOnSubtaskId: string,
  ): Promise<void> {
    // Escritura: guard por matriz/condicional (subtask:update rule).
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    const task = await this.findTeamTask(organizationId, teamId, taskId);
    await this.findTeamSubtask(task.id, subtaskId);

    const dependency = await this.prisma.subtaskDependency.findUnique({
      where: {
        subtaskId_dependsOnSubtaskId: { subtaskId, dependsOnSubtaskId },
      },
    });
    if (dependency === null) {
      throw new NotFoundException('Dependencia no encontrada');
    }
    await this.prisma.subtaskDependency.delete({
      where: {
        subtaskId_dependsOnSubtaskId: { subtaskId, dependsOnSubtaskId },
      },
    });
  }
}
