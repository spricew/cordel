import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { createHash, randomBytes } from 'node:crypto';
import { Prisma } from '../../prisma/generated/client.js';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { EMAIL_QUEUE } from '../queue/queue.tokens.js';
import type { EmailJob } from '../queue/email-job.js';
import { RateLimitService } from '../queue/rate-limit.service.js';
import type { CreateInvitationDto } from './dto/create-invitation.dto.js';
import type { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import type { AcceptedInvitation, CreatedInvitation, Invitation } from '@cordel/types';

/* Invitaciones por email (paso 8). La autorización de escribir vive en
 * la matriz: `member:invite` la llevan OWNER y ADMIN (org-level), y la
 * exige el PermissionGuard en cada ruta. La aceptación es distinta: la
 * abre el usuario invitado con SU sesión + el token del email.
 *
 * Reglas del ciclo de vida:
 * - pendiente = acceptedAt null Y revokedAt null Y no vencida;
 * - una sola pendiente por email y organización (pendingKey único);
 * - una invitación vencida se sustituye al reinvitar; no bloquea;
 * - aceptar exige loguearse con el MISMO email de la invitación;
 * - vencida/revocada/ya-aceptada devuelven 409 (no manipulan el estado);
 * - el token se guarda hasheado; el valor en claro solo se devuelve al
 *   crear o reenviar, y lo envía la cola de emails;
 * - el límite free (10 miembros por org) se mira al aceptar, que es
 *   cuando nace la Membership de verdad.
 *
 * Emails: el job lleva el token y el enlace profundo; el worker lo envía
 * por SMTP o lo escribe en storage/emails cuando no hay SMTP. */
const INVITATION_TTL_DAYS = 7;
const INVITATION_TTL_MS = INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000;

interface InvitationRow {
  id: string;
  organizationId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  invitedById: string;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  sentAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function pendingKeyFor(organizationId: string, email: string): string {
  return `${organizationId}:${email}`;
}

@Injectable()
export class InvitationsService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly rateLimit: RateLimitService,
    @Inject(EMAIL_QUEUE) private readonly emails: Queue,
  ) {}

  private toInvitation(row: InvitationRow): Invitation {
    return {
      id: row.id,
      organizationId: row.organizationId,
      email: row.email,
      role: row.role,
      invitedById: row.invitedById,
      acceptedAt: row.acceptedAt === null ? null : row.acceptedAt.toISOString(),
      revokedAt: row.revokedAt === null ? null : row.revokedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      sentAt: row.sentAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toCreatedInvitation(row: InvitationRow, token: string): CreatedInvitation {
    return { ...this.toInvitation(row), token };
  }

  private async assertOrganizationExists(
    orgSlug: string,
  ): Promise<{ id: string; ownerId: string; name: string }> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: orgSlug },
    });
    if (organization === null) {
      throw new NotFoundException('Organización no encontrada');
    }
    return { id: organization.id, ownerId: organization.ownerId, name: organization.name };
  }

  private async enqueueInvitationEmail(params: {
    to: string;
    organizationName: string;
    inviterName: string;
    token: string;
  }): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const acceptUrl = `${appUrl.replace(/\/+$/, '')}/invitations?token=${encodeURIComponent(params.token)}`;

    // El email va por la cola: la petición HTTP no espera al SMTP.
    // El job lleva todo lo que el worker necesita (ver EmailJob).
    const job: EmailJob = {
      kind: 'invitation',
      to: params.to,
      organizationName: params.organizationName,
      inviterName: params.inviterName,
      token: params.token,
      acceptUrl,
    };
    await this.emails.add('invitation', job, {
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 20 },
    });
  }

  public async create(
    orgSlug: string,
    invitedById: string,
    dto: CreateInvitationDto,
  ): Promise<CreatedInvitation> {
    const org = await this.assertOrganizationExists(orgSlug);
    const now = new Date();

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

    // Una invitación vencida no debe bloquear una nueva: se revoca y se
    // deja el camino libre. No genera auditoría porque no es una acción
    // del usuario, sino la consecuencia del vencimiento.
    await this.prisma.invitation.updateMany({
      where: {
        organizationId: org.id,
        email: dto.email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { lte: now },
      },
      data: { revokedAt: now, pendingKey: null },
    });

    // Una sola pendiente vigente por (organización, email): ni duplicadas
    // ni spam de re-invitar. `pendingKey` es la garantía a nivel de base
    // para peticiones concurrentes.
    const pending = await this.prisma.invitation.findFirst({
      where: {
        organizationId: org.id,
        email: dto.email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
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

    const token = randomBytes(32).toString('base64url');
    let rows: InvitationRow;

    try {
      rows = await this.prisma.invitation.create({
        data: {
          organizationId: org.id,
          email: dto.email,
          role: dto.role ?? 'MEMBER',
          tokenHash: hashInvitationToken(token),
          pendingKey: pendingKeyFor(org.id, dto.email),
          invitedById,
          sentAt: now,
          expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya hay una invitación pendiente para ese email');
      }
      throw error;
    }

    const inviter = await this.prisma.user.findUnique({ where: { id: invitedById } });
    await this.enqueueInvitationEmail({
      to: rows.email,
      organizationName: org.name,
      inviterName: inviter?.name ?? 'Un compañero',
      token,
    });
    void this.audit.record({
      action: 'INVITATION_CREATED',
      actorId: invitedById,
      organizationId: org.id,
      entityType: 'Invitation',
      entityId: rows.id,
      metadata: { email: rows.email, role: rows.role },
    });
    return this.toCreatedInvitation(rows, token);
  }

  public async listPending(orgSlug: string): Promise<Invitation[]> {
    await this.assertOrganizationExists(orgSlug);
    const rows = await this.prisma.invitation.findMany({
      where: { organization: { slug: orgSlug }, acceptedAt: null, revokedAt: null },
      orderBy: { sentAt: 'desc' },
    });
    return rows.map((row) => this.toInvitation(row));
  }

  public async resend(
    orgSlug: string,
    invitationId: string,
    actorId: string,
  ): Promise<CreatedInvitation> {
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
    if (row.revokedAt !== null) {
      throw new ConflictException('La invitación fue revocada');
    }

    const now = new Date();
    const token = randomBytes(32).toString('base64url');
    let updated: InvitationRow;

    try {
      updated = await this.prisma.invitation.update({
        where: { id: row.id },
        data: {
          tokenHash: hashInvitationToken(token),
          pendingKey: pendingKeyFor(row.organizationId, row.email),
          sentAt: now,
          expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya hay una invitación pendiente para ese email');
      }
      throw error;
    }

    const inviter = await this.prisma.user.findUnique({ where: { id: actorId } });
    await this.enqueueInvitationEmail({
      to: updated.email,
      organizationName: org.name,
      inviterName: inviter?.name ?? 'Un compañero',
      token,
    });
    void this.audit.record({
      action: 'INVITATION_RESENT',
      actorId,
      organizationId: org.id,
      entityType: 'Invitation',
      entityId: updated.id,
      metadata: { email: updated.email, role: updated.role },
    });
    return this.toCreatedInvitation(updated, token);
  }

  public async revoke(orgSlug: string, invitationId: string, revokedById: string): Promise<void> {
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
    // Revocar dos veces no cambia nada (idempotente): 204 igual, y la
    // auditoría tampoco se duplica.
    if (row.revokedAt === null) {
      await this.prisma.invitation.update({
        where: { id: row.id },
        data: { revokedAt: new Date(), pendingKey: null },
      });
      void this.audit.record({
        action: 'INVITATION_REVOKED',
        actorId: revokedById,
        organizationId: org.id,
        entityType: 'Invitation',
        entityId: row.id,
        metadata: { email: row.email, role: row.role },
      });
    }
  }

  public async accept(userId: string, dto: AcceptInvitationDto): Promise<AcceptedInvitation> {
    await this.rateLimit.allowInviteAcceptAttempt(userId);

    const [row, user] = await Promise.all([
      this.prisma.invitation.findUnique({
        where: { tokenHash: hashInvitationToken(dto.token) },
      }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    // Misma respuesta 404 si el token no existe O si pertenece a otro email:
    // impide enumerar tokens válidos o conocer el estado de invitaciones ajenas.
    if (
      row === null ||
      user === null ||
      user.email.trim().toLowerCase() !== row.email.trim().toLowerCase()
    ) {
      await this.rateLimit.registerInviteAcceptFailure(userId);
      throw new NotFoundException('Invitación no encontrada');
    }

    // Los estados terminales no son intentos de adivinanza: no cuentan
    // para el rate limit (evita bloquear a quien reintenta un correo viejo).
    if (row.acceptedAt !== null) {
      throw new ConflictException('La invitación ya fue aceptada');
    }
    if (row.revokedAt !== null) {
      throw new ConflictException('La invitación fue revocada');
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException('La invitación venció');
    }

    const memberLimit = this.config.getOrThrow<number>('FREE_MAX_MEMBERS_PER_ORGANIZATION');
    const orgLimit = this.config.getOrThrow<number>('FREE_MAX_ORGANIZATIONS_PER_USER');

    const { membership, organization } = await this.prisma.$transaction(async (tx) => {
      // Serializa aceptaciones concurrentes sobre la misma organización para que
      // el conteo de miembros nunca supere el límite del plan bajo carrera.
      await tx.$executeRaw`SELECT id FROM "Organization" WHERE id = ${row.organizationId} FOR UPDATE`;

      const now = new Date();
      const claimed = await tx.invitation.updateMany({
        where: {
          id: row.id,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { acceptedAt: now, pendingKey: null },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('La invitación ya fue aceptada o dejó de estar vigente');
      }

      const already = await tx.membership.findFirst({
        where: { userId, organizationId: row.organizationId },
      });
      if (already !== null) {
        throw new ConflictException('Ya eres miembro de la organización');
      }

      const members = await tx.membership.count({
        where: { organizationId: row.organizationId },
      });
      if (members >= memberLimit) {
        throw new ForbiddenException('La organización alcanzó el límite de miembros');
      }

      if (user.plan === 'FREE') {
        const userOrgs = await tx.membership.count({ where: { userId } });
        if (userOrgs >= orgLimit) {
          throw new ForbiddenException('Alcanzaste el límite de organizaciones de tu plan');
        }
      }

      const createdMembership = await tx.membership.create({
        data: { userId, organizationId: row.organizationId, role: row.role },
      });
      const org = await tx.organization.findUniqueOrThrow({
        where: { id: row.organizationId },
        select: { id: true, name: true, slug: true, ownerId: true },
      });

      return { membership: createdMembership, organization: org };
    });

    await this.rateLimit.registerInviteAcceptSuccess(userId);

    // MEMBER_ADDED: aviso al OWNER (quien invitó ya lo sabe; el que
    // entró acaba de aceptar y no necesita el aviso).
    if (organization.ownerId !== userId) {
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
    // MEMBER_JOINED en bitácora: quién entró, con qué rol y cuándo.
    void this.audit.record({
      action: 'MEMBER_JOINED',
      actorId: userId,
      organizationId: row.organizationId,
      entityType: 'Membership',
      entityId: `${row.organizationId}:${userId}`,
      metadata: { email: row.email, role: row.role, invitationId: row.id },
    });
    return {
      userId: membership.userId,
      organizationId: membership.organizationId,
      role: membership.role,
      createdAt: membership.createdAt.toISOString(),
      updatedAt: membership.updatedAt.toISOString(),
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    };
  }
}
