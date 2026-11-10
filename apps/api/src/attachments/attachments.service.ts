import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAttachmentDto } from './dto/create-attachment.dto.js';
import type { Attachment } from '@cordel/types';

/* Adjuntos de una tarea O de una subtarea (uno de taskId / subtaskId
 * es string y el otro null). Como los comentarios, NO están en la
 * matriz del ADR 002: la regla es de pertenencia y de posesión.
 * - leer/subir/quitar: ser TeamMember del equipo;
 * - borrar: SOLO quien subió el archivo.
 *
 * Storage v1: archivo plano en disco bajo STORAGE_DIR
 * (por defecto `storage/attachments` junto a apps/api). La subida
 * llega en base64 por JSON (sin multer): el límite lo marca el body.
 * Migrar a multipart/S3 no cambia el contrato: `storageKey` es la
 * referencia del almacén, `fileName` lo que muestra la UI. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface DownloadedAttachment {
  bytes: Buffer;
  mimeType: string;
  fileName: string;
}

@Injectable()
export class AttachmentsService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private toAttachment(row: {
    id: string;
    organizationId: string;
    teamId: string;
    taskId: string | null;
    subtaskId: string | null;
    fileName: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    uploadedById: string;
    createdAt: Date;
  }): Attachment {
    return {
      id: row.id,
      organizationId: row.organizationId,
      teamId: row.teamId,
      taskId: row.taskId,
      subtaskId: row.subtaskId,
      fileName: row.fileName,
      storageKey: row.storageKey,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      uploadedById: row.uploadedById,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private storageDir(): string {
    return (
      this.config.get<string>('STORAGE_DIR') ??
      path.resolve(process.cwd(), 'storage', 'attachments')
    );
  }

  /* Cadena de resolución idéntica a la de los demás services (org 404 →
   * equipo 404 → TeamMember 403). */
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

  /* El adjunto cuelga de ESTA tarea: directo o a través de su subtarea. */
  private async findTaskAttachment(taskId: string, attachmentId: string): Promise<Attachment> {
    const row = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, OR: [{ taskId }, { subtask: { taskId } }] },
    });
    if (row === null) {
      throw new NotFoundException('Adjunto no encontrado');
    }
    return this.toAttachment(row);
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
    dto: CreateAttachmentDto,
  ): Promise<Attachment> {
    // Subir exige ser TeamMember; el rol no interviene.
    const { organizationId, teamId } = await this.assertOrgTeamMember(orgSlug, teamSlug, userId);
    const level = await this.resolveLevel(organizationId, teamId, taskId, subtaskId);

    // El tamaño real se calcula delcontenido decodificado: no se le
    // cree al cliente el tamaño que declara.
    const bytes = Buffer.from(dto.contentBase64, 'base64');
    if (bytes.length === 0) {
      throw new BadRequestException('El archivo está vacío');
    }
    if (bytes.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('El archivo supera el límite de 5 MB');
    }

    // Nombre seguro para el almacén: la ruta nunca se construye con
    // lo que manda el cliente (traversal, separadores, control).
    // Capturar caracteres de control es el propósito del sanitize,
    // no un descuido: la ruta del almacén nunca sale del cliente.
    // eslint-disable-next-line no-control-regex
    const safeName = dto.fileName.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_').trim() || 'archivo';
    const storageKey = `${randomUUID()}-${safeName}`;
    const dir = this.storageDir();
    const filePath = path.join(dir, storageKey);

    await mkdir(dir, { recursive: true });
    try {
      await writeFile(filePath, bytes);
      const row = await this.prisma.attachment.create({
        data: {
          organizationId,
          teamId,
          taskId: level.taskId,
          subtaskId: level.subtaskId,
          fileName: safeName,
          storageKey,
          mimeType: dto.mimeType,
          sizeBytes: bytes.length,
          uploadedById: userId,
        },
      });
      return this.toAttachment(row);
    } catch (error) {
      // La fila no nació: quitar el archivo del almacén para no
      // dejar basura huérfana.
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }

  public async list(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    subtaskId: string | undefined,
  ): Promise<Attachment[]> {
    const { organizationId, teamId } = await this.assertOrgTeamMember(orgSlug, teamSlug, userId);
    const task = await this.findTeamTask(organizationId, teamId, taskId);
    const where: { taskId: string } | { subtaskId: string } =
      subtaskId === undefined
        ? { taskId: task.id }
        : { subtaskId: (await this.findTeamSubtask(task.id, subtaskId)).id };

    const rows = await this.prisma.attachment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toAttachment(row));
  }

  public async download(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    attachmentId: string,
  ): Promise<DownloadedAttachment> {
    // Leer exige ser TeamMember (igual que las tareas).
    const { organizationId, teamId } = await this.assertOrgTeamMember(orgSlug, teamSlug, userId);
    await this.findTeamTask(organizationId, teamId, taskId);
    const attachment = await this.findTaskAttachment(taskId, attachmentId);

    let bytes: Buffer;
    try {
      bytes = await readFile(path.join(this.storageDir(), attachment.storageKey));
    } catch {
      throw new NotFoundException('Adjunto no encontrado');
    }
    return { bytes, mimeType: attachment.mimeType, fileName: attachment.fileName };
  }

  public async remove(
    orgSlug: string,
    teamSlug: string,
    userId: string,
    taskId: string,
    attachmentId: string,
  ): Promise<void> {
    const { organizationId, teamId } = await this.assertOrgTeamMember(orgSlug, teamSlug, userId);
    await this.findTeamTask(organizationId, teamId, taskId);
    const attachment = await this.findTaskAttachment(taskId, attachmentId);
    if (attachment.uploadedById !== userId) {
      throw new ForbiddenException('Solo quien subió el archivo puede eliminarlo');
    }

    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    await unlink(path.join(this.storageDir(), attachment.storageKey)).catch(() => undefined);
  }
}
