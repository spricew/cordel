import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CreateInvitationDto } from './dto/create-invitation.dto.js';
import type { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import type { Invitation, Membership } from '@cordel/types';

/* Invitaciones por email (paso 8). La autorización de escribir vive en
 * la matriz: `member:invite` la llevan OWNER y ADMIN (org-level), y la
 * exige el PermissionGuard en cada ruta. La aceptación es distinta: la
 * abre el usuario invitado con SU sesión + el token del email.
 *
 * Reglas del ciclo de vida:
 * - pendiente = acceptedAt null Y revokedAt null Y no vencida;
 * - una sola pendiente por email y organización (409 si repiten);
 * - aceptar exige loguearse con el MISMO email de la invitación;
 * - vencida/revocada/ya-aceptada devuelven 409 (no manipulan el estado);
 * - el límite free (10 miembros por org) se mira al aceptar, que es
 *   cuando nace la Membership de verdad.
 *
 * Emails: no hay SMTP aún — la respuesta de crear incluye el token
 * para que quien invita lo copie y lo mande a mano. */
const INVITATION_TTL_DAYS = 7;

export interface InvitationWithToken extends Invitation {
  token: string;
}

@Injectable()
export class InvitationsService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  private toInvitation(
    row: {
      id: string;
      organizationId: string;
      email: string;
      role: 'OWNER' | 'ADMIN' | 'MEMBER';
      invitedById: string;
      acceptedAt: Date | null;
      revokedAt: Date | null;
      expiresAt: Date;
      createdAt: Date;
    },
    token: string,
  ): Invitation {
    return {
      id: row.id,
      organizationId: row.organizationId,
      email: row.email,
      role: row.role,
      token,
      invitedById: row.invitedById,
      acceptedAt: row.acceptedAt === null ? null : row.acceptedAt.toISOString(),
      revokedAt: row.revokedAt === null ? null : row.revokedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async assertOrganizationExists(
    orgSlug: string,
  ): Promise<{ id: string; ownerId: string }> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    if (organization === null) {
      throw new NotFoundException('Organización no encontrada');
    }
    return { id: organization.id, ownerId: organization.ownerId };
  }

  public async create(
    orgSlug: string,
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<Invitation> {
    const org = await this.assertOrganizationExists(orgSlug);

    // Ya es miembro (o es el OWNER): no se invita a quien ya está.
    const existingMember = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existingMember !== null) {
      const membership = await this.prisma.membership.findFirst({
        where: { userId: existingMember.id, organizationId: org.id },
      });
      if (membership !== null) {
        throw new ConflictException('Ya es miembro de la organización');
      }
    }

    // Una sola pendiente por (organización, email): ni duplicadas ni
    // spam de re-invitar.
    const pending = await this.prisma.invitation.findFirst({
      where: {
        organizationId: org.id,
        email: dto.email,
        acceptedAt: null,
        revokedAt: null,
      },
    });
    if (pending !== null) {
      throw new ConflictException('Ya hay una invitación pendiente para ese email');
    }

    // El límite se mira también AQUÍ (error temprano, sin hacer esperar
    // al invitado); el authoritative queda al aceptar.
    const limit = this.config.getOrThrow<number>('FREE_MAX_MEMBERS_PER_ORGANIZATION');
    const members = await this.prisma.membership.count({
      where: { organizationId: org.id },
    });
    if (members >= limit) {
      throw new ForbiddenException('La organización alcanzó el límite de miembros');
    }

    const rows = await this.prisma.invitation.create({
      data: {
        organizationId: org.id,
        email: dto.email,
        role: dto.role ?? 'MEMBER',
        token: randomBytes(32).toString('base64url'),
        invitedById,
        expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return this.toInvitation(rows, rows.token);
  }

  public async listPending(orgSlug: string): Promise<Invitation[]> {
    await this.assertOrganizationExists(orgSlug);
    const rows = await this.prisma.invitation.findMany({
      where: { organization: { slug: orgSlug }, acceptedAt: null, revokedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toInvitation(row, row.token));
  }

  public async revoke(orgSlug: string, invitationId: string): Promise<void> {
    const org = await this.assertOrganizationExists(orgSlug);
    const row = await this.prisma.invitation.findFirst({
      where: { id: invitationId, organizationId: org.id },
    });
    if (row === null) {
      throw new NotFoundException('Invitación no encontrada');
    }
    if (row.acceptedAt !== null) {
      throw new ConflictException('La invitación ya fue aceptada');
    }
    // Revocar dos veces no cambia nada (idempotente): 204 igual.
    if (row.revokedAt === null) {
      await this.prisma.invitation.update({
        where: { id: row.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  public async accept(userId: string, dto: AcceptInvitationDto): Promise<Membership> {
    // El token es la clave única de la "carta": misma respuesta 404
    // si no existe que si está mal (sin filtrar existencia).
    const row = await this.prisma.invitation.findUnique({
      where: { token: dto.token },
    });
    if (row === null) {
      throw new NotFoundException('Invitación no encontrada');
    }
    if (row.acceptedAt !== null) {
      throw new ConflictException('La invitación ya fue aceptada');
    }
    if (row.revokedAt !== null) {
      throw new ConflictException('La invitación fue revocada');
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException('La invitación venció');
    }

    // Solo entra quien tiene la cuenta del email invitado.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user === null || user.email !== row.email.toLowerCase()) {
      throw new ForbiddenException('El email de la invitación no coincide con tu cuenta');
    }

    const already = await this.prisma.membership.findFirst({
      where: { userId, organizationId: row.organizationId },
    });
    if (already !== null) {
      throw new ConflictException('Ya eres miembro de la organización');
    }

    // Límite authoritative: aquí nace la Membership de verdad.
    const limit = this.config.getOrThrow<number>('FREE_MAX_MEMBERS_PER_ORGANIZATION');
    const members = await this.prisma.membership.count({
      where: { organizationId: row.organizationId },
    });
    if (members >= limit) {
      throw new ForbiddenException('La organización alcanzó el límite de miembros');
    }

    // Membership + sello de aceptación, en una sola operación.
    const [membership] = await this.prisma.$transaction([
      this.prisma.membership.create({
        data: { userId, organizationId: row.organizationId, role: row.role },
      }),
      this.prisma.invitation.update({
        where: { id: row.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    // MEMBER_ADDED: aviso al OWNER (quien invitó ya lo sabe; el que
    // entró acaba de aceptar y no necesita el aviso).
    const organization = await this.prisma.organization.findUnique({
      where: { id: row.organizationId },
    });
    if (organization !== null && organization.ownerId !== userId) {
      await this.notifications.emit({
        type: 'MEMBER_ADDED',
        userId: organization.ownerId,
        organizationId: organization.id,
        teamId: null,
        title: 'Nuevo miembro en la organización',
        body: `${user.name} entró a ${organization.name}`,
        taskId: null,
        subtaskId: null,
      });
    }
    return {
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role,
      createdAt: membership.createdAt.toISOString(),
      updatedAt: membership.updatedAt.toISOString(),
    };
  }
}
