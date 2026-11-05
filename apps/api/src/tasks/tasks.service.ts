import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTaskDto } from './dto/create-task.dto.js';
import type { UpdateTaskDto } from './dto/update-task.dto.js';
import type { Task } from '@cordel/types';

/* Tarea de un equipo. La escritura la autoriza el PermissionGuard
 * (@RequirePermission task:* con teamSlug); aquí viven los DATOS:
 * resolver el par (org, equipo), el aislamiento estricto de lectura
 * (equipo member) y la FK compuesta en acción. */
@Injectable()
export class TasksService {
  public constructor(private readonly prisma: PrismaService) {}

  private toTask(task: {
    id: string;
    organizationId: string;
    teamId: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigneeId: string | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return {
      id: task.id,
      organizationId: task.organizationId,
      teamId: task.teamId,
      title: task.title,
      description: task.description,
      status: task.status as Task['status'],
      priority: task.priority as Task['priority'],
      assigneeId: task.assigneeId,
      dueDate: task.dueDate !== null ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  // Slugs de ruta → ids. Org por slug (404 si no existe O si es
  // ajena: mismo mensaje, sin filtrar existencia) y equipo por el
  // PAR (@@unique([organizationId, slug])) — nunca el slug solo.
  public async resolveTeam(
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

  // Aislamiento de organization: ver que una org existe exige ser
  // miembro de ella. 404 (mismo mensaje que una fantasma, sin fugas).
  private async assertOrgMembership(orgSlug: string, userId: string): Promise<void> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organization: { slug: orgSlug } },
    });
    if (membership === null) {
      throw new NotFoundException('Organización no encontrada');
    }
  }

  // Aislamiento estricto por equipo (ADR 002): leer tareas exige ser
  // TeamMember del equipo; el rol de la organización NO alcanza.
  private async assertTeamMember(teamId: string, userId: string): Promise<void> {
    const member = await this.prisma.teamMember.findFirst({
      where: { userId, teamId },
    });
    if (member === null) {
      throw new ForbiddenException('No eres miembro de este equipo');
    }
  }

  // El responsable (assignee) tiene que ser TeamMember del equipo:
  // asignar a alguien de fuera rompería el aislamiento de lectura.
  private async assertAssigneeIsTeamMember(
    teamId: string,
    userId: string | undefined,
  ): Promise<void> {
    if (userId === undefined) return;
    const member = await this.prisma.teamMember.findFirst({
      where: { userId, teamId },
    });
    if (member === null) {
      throw new BadRequestException('El responsable debe ser miembro del equipo');
    }
  }

  public async create(orgSlug: string, teamSlug: string, dto: CreateTaskDto): Promise<Task> {
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    await this.assertAssigneeIsTeamMember(teamId, dto.assigneeId);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        assigneeId: dto.assigneeId,
        status: dto.status,
        priority: dto.priority,
        dueDate: dto.dueDate === undefined ? undefined : new Date(dto.dueDate),
        // FK compuesta en acción: el par tiene que apuntar al mismo
        // equipo Y a SU organización. La base rechaza mezclar los dos.
        teamId,
        organizationId,
      },
    });
    return this.toTask(task);
  }

  public async list(orgSlug: string, teamSlug: string, userId: string): Promise<Task[]> {
    // Orden de las preguntas para no filtrar existencia: primero la
    // org (404 si no eres miembro), luego el equipo (404), luego el
    // TeamMember del equipo (403 solo para miembros de la org).
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    await this.assertTeamMember(teamId, userId);

    const tasks = await this.prisma.task.findMany({
      where: { organizationId, teamId },
      orderBy: { createdAt: 'desc' },
    });
    return tasks.map((task) => this.toTask(task));
  }

  private async findTeamTask(
    organizationId: string,
    teamId: string,
    taskId: string,
  ): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        teamId,
        organizationId,
      },
    });
    if (task === null) {
      throw new NotFoundException('Tarea no encontrada');
    }
    return this.toTask(task);
  }

  public async findById(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
  ): Promise<Task> {
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    await this.assertTeamMember(teamId, userId);
    return this.findTeamTask(organizationId, teamId, taskId);
  }

  public async update(
    orgSlug: string,
    teamSlug: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    // Escrituras por matriz de roles (guard task:update); la
    // membresía de equipo no se exige para escribir — solo para leer.
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    await this.assertAssigneeIsTeamMember(teamId, dto.assigneeId);
    await this.findTeamTask(organizationId, teamId, taskId); // 404 si no existe en este equipo

    const data: {
      title?: string;
      description?: string;
      assigneeId?: string;
      status?: UpdateTaskDto['status'];
      priority?: UpdateTaskDto['priority'];
      dueDate?: Date;
    } = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.assigneeId !== undefined) data.assigneeId = dto.assigneeId;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data,
    });
    return this.toTask(task);
  }

  public async remove(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
  ): Promise<void> {
    // Escritura por matriz de roles (guard task:delete).
    await this.assertOrgMembership(orgSlug, userId);
    const { organizationId, teamId } = await this.resolveTeam(orgSlug, teamSlug);
    await this.findTeamTask(organizationId, teamId, taskId);

    await this.prisma.task.delete({ where: { id: taskId } });
  }
}
