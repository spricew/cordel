import {
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { createHash } from 'node:crypto';
import { Prisma } from '../../prisma/generated/client.js';
import type { AuditService } from '../audit/audit.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { RateLimitService } from '../queue/rate-limit.service.js';
import { InvitationsService } from './invitations.service.js';

/* El harness imita la forma del cliente Prisma; en pruebas no aporta
 * tipar cada retorno interno ni convertir cada mock en una función
 * enlazada. Las aserciones de cada caso validan lo que importa. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */

const TOKEN = 'secret-token-value';
const TOKEN_HASH = createHash('sha256').update(TOKEN).digest('hex');

interface InvitationRowState {
  id: string;
  organizationId: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  tokenHash: string;
  pendingKey: string | null;
  invitedById: string;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  sentAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

interface MockState {
  invitation: InvitationRowState | null;
  pendingInvitation: InvitationRowState | null;
  user: {
    id: string;
    email: string;
    name: string;
    plan: 'FREE' | 'PREMIUM';
  } | null;
  existingMemberUser: { id: string; email: string } | null;
  existingMembership: { userId: string; organizationId: string } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
  };
  claimedCount: number;
  expiredCount: number;
  orgMemberCount: number;
  userOrgCount: number;
  createError: Error | null;
}

function createHarness(overrides: Partial<MockState> = {}) {
  const now = new Date();
  const invitation: InvitationRowState = {
    id: 'inv_1',
    organizationId: 'org_1',
    email: 'invited@cordel.test',
    role: 'ADMIN',
    tokenHash: TOKEN_HASH,
    pendingKey: 'org_1:invited@cordel.test',
    invitedById: 'owner_1',
    acceptedAt: null,
    revokedAt: null,
    sentAt: now,
    expiresAt: new Date(Date.now() + 86_400_000),
    createdAt: now,
  };

  const state: MockState = {
    invitation,
    pendingInvitation: null,
    user: {
      id: 'user_2',
      email: 'invited@cordel.test',
      name: 'Invitado',
      plan: 'FREE',
    },
    existingMemberUser: null,
    existingMembership: null,
    organization: {
      id: 'org_1',
      name: 'Acme',
      slug: 'acme',
      ownerId: 'owner_1',
    },
    claimedCount: 1,
    expiredCount: 0,
    orgMemberCount: 1,
    userOrgCount: 0,
    createError: null,
    ...overrides,
  };

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    invitation: {
      updateMany: vi.fn().mockImplementation(async () => ({ count: state.claimedCount })),
    },
    membership: {
      findFirst: vi.fn().mockImplementation(async () => state.existingMembership),
      count: vi
        .fn()
        .mockImplementation(
          async ({ where }: { where: { organizationId?: string; userId?: string } }) => {
            if (where.organizationId !== undefined) return state.orgMemberCount;
            return state.userOrgCount;
          },
        ),
      create: vi
        .fn()
        .mockImplementation(
          async ({
            data,
          }: {
            data: { userId: string; organizationId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' };
          }) => ({
            userId: data.userId,
            organizationId: data.organizationId,
            role: data.role,
            createdAt,
            updatedAt: createdAt,
          }),
        ),
    },
    organization: {
      findUniqueOrThrow: vi.fn().mockImplementation(async () => state.organization),
    },
  };

  const prisma = {
    organization: {
      findUnique: vi.fn().mockImplementation(async () => state.organization),
    },
    invitation: {
      findUnique: vi.fn().mockImplementation(async () => state.invitation),
      findFirst: vi.fn().mockImplementation(async ({ where }: { where: { id?: string } }) => {
        // El reenvío busca por id; la creación busca la pendiente vigente.
        return typeof where.id === 'string' ? state.invitation : state.pendingInvitation;
      }),
      updateMany: vi.fn().mockImplementation(async () => ({ count: state.expiredCount })),
      create: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
        if (state.createError !== null) throw state.createError;

        return {
          id: 'inv_new',
          organizationId: data.organizationId,
          email: data.email,
          role: data.role,
          tokenHash: data.tokenHash,
          pendingKey: data.pendingKey,
          invitedById: data.invitedById,
          acceptedAt: null,
          revokedAt: null,
          sentAt: data.sentAt,
          expiresAt: data.expiresAt,
          createdAt: now,
        };
      }),
      update: vi.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...(state.invitation ?? invitation),
        ...data,
      })),
    },
    user: {
      findUnique: vi.fn().mockImplementation(async () => state.user),
      findFirst: vi.fn().mockImplementation(async () => state.existingMemberUser),
    },
    membership: {
      findFirst: vi.fn().mockImplementation(async () => state.existingMembership),
      count: vi
        .fn()
        .mockImplementation(
          async ({ where }: { where: { organizationId?: string; userId?: string } }) => {
            if (where.organizationId !== undefined) return state.orgMemberCount;
            return state.userOrgCount;
          },
        ),
    },
    $transaction: vi
      .fn()
      .mockImplementation(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  } as unknown as PrismaService;

  const config = {
    getOrThrow: vi.fn().mockImplementation((key: string) => {
      if (key === 'FREE_MAX_MEMBERS_PER_ORGANIZATION') return 10;
      if (key === 'FREE_MAX_ORGANIZATIONS_PER_USER') return 3;
      throw new Error(`Unexpected config key: ${key}`);
    }),
    get: vi.fn().mockImplementation((key: string, fallback: string) => {
      if (key === 'APP_URL') return 'http://localhost:3000';
      return fallback;
    }),
  } as unknown as ConfigService;

  const notifications = {
    emit: vi.fn().mockResolvedValue(undefined),
  } as unknown as NotificationsService;

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuditService;

  const rateLimit = {
    allowInviteAcceptAttempt: vi.fn().mockResolvedValue(undefined),
    registerInviteAcceptFailure: vi.fn().mockResolvedValue(undefined),
    registerInviteAcceptSuccess: vi.fn().mockResolvedValue(undefined),
  } as unknown as RateLimitService;

  const queue = {
    add: vi.fn().mockResolvedValue(undefined),
  } as unknown as Queue;

  const service = new InvitationsService(prisma, config, notifications, audit, rateLimit, queue);

  return { service, state, tx, prisma, notifications, audit, rateLimit, queue };
}

describe('InvitationsService.accept', () => {
  it('acepta una invitación válida, limpia rate limit, notifica al owner y registra auditoría sin token', async () => {
    const { service, prisma, notifications, audit, rateLimit } = createHarness();

    const result = await service.accept('user_2', { token: TOKEN });

    expect(prisma.invitation.findUnique).toHaveBeenCalledWith({ where: { tokenHash: TOKEN_HASH } });
    expect(result).toEqual({
      userId: 'user_2',
      organizationId: 'org_1',
      role: 'ADMIN',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      organization: { id: 'org_1', name: 'Acme', slug: 'acme' },
    });
    expect(rateLimit.allowInviteAcceptAttempt).toHaveBeenCalledWith('user_2');
    expect(rateLimit.registerInviteAcceptSuccess).toHaveBeenCalledWith('user_2');
    expect(notifications.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'MEMBER_ADDED',
        userId: 'owner_1',
        organizationId: 'org_1',
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'MEMBER_JOINED',
        actorId: 'user_2',
        organizationId: 'org_1',
      }),
    );
    const auditMetadata = (audit.record as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
      ?.metadata as Record<string, unknown>;
    expect(auditMetadata).not.toHaveProperty('token');
  });

  it('compara correos sin distinguir mayúsculas o espacios', async () => {
    const { service } = createHarness({
      user: { id: 'user_2', email: '  Invited@Cordel.TEST ', name: 'Invitado', plan: 'FREE' },
    });

    const result = await service.accept('user_2', { token: TOKEN });
    expect(result.organization.slug).toBe('acme');
  });

  it('devuelve 404 uniforme y registra fallo cuando el token no existe o pertenece a otro correo', async () => {
    const missing = createHarness({ invitation: null });
    await expect(missing.service.accept('user_2', { token: 'nope' })).rejects.toThrow(
      new NotFoundException('Invitación no encontrada'),
    );
    expect(missing.rateLimit.registerInviteAcceptFailure).toHaveBeenCalledWith('user_2');

    // Incluso si la invitación ajena ya fue aceptada, revocada o venció,
    // otro usuario debe recibir 404 (cero oráculo de estado).
    for (const statusOverride of [
      { acceptedAt: new Date() },
      { revokedAt: new Date() },
      { expiresAt: new Date(Date.now() - 1000) },
      {},
    ]) {
      const otherUser = createHarness({
        user: { id: 'attacker', email: 'attacker@evil.test', name: 'Attacker', plan: 'FREE' },
        invitation: {
          id: 'inv_1',
          organizationId: 'org_1',
          email: 'victim@cordel.test',
          role: 'MEMBER',
          tokenHash: TOKEN_HASH,
          pendingKey: 'org_1:victim@cordel.test',
          invitedById: 'owner_1',
          acceptedAt: null,
          revokedAt: null,
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 86_400_000),
          createdAt: new Date(),
          ...statusOverride,
        },
      });

      await expect(otherUser.service.accept('attacker', { token: TOKEN })).rejects.toThrow(
        new NotFoundException('Invitación no encontrada'),
      );
      expect(otherUser.rateLimit.registerInviteAcceptFailure).toHaveBeenCalledWith('attacker');
    }
  });

  it('detiene la petición antes de consultar la base si el rate limit bloquea', async () => {
    const { service, prisma, rateLimit } = createHarness();
    (rateLimit.allowInviteAcceptAttempt as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new HttpException('Demasiados intentos fallidos.', 429),
    );

    await expect(service.accept('user_2', { token: TOKEN })).rejects.toThrow(HttpException);
    expect(prisma.invitation.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza invitación propia ya aceptada, revocada o vencida con 409 sin contar como fallo', async () => {
    const accepted = createHarness({
      invitation: {
        id: 'inv_1',
        organizationId: 'org_1',
        email: 'invited@cordel.test',
        role: 'MEMBER',
        tokenHash: TOKEN_HASH,
        pendingKey: null,
        invitedById: 'owner_1',
        acceptedAt: new Date(),
        revokedAt: null,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 10_000),
        createdAt: new Date(),
      },
    });
    await expect(accepted.service.accept('user_2', { token: TOKEN })).rejects.toThrow(
      new ConflictException('La invitación ya fue aceptada'),
    );
    expect(accepted.rateLimit.registerInviteAcceptFailure).not.toHaveBeenCalled();

    const revoked = createHarness({
      invitation: {
        id: 'inv_1',
        organizationId: 'org_1',
        email: 'invited@cordel.test',
        role: 'MEMBER',
        tokenHash: TOKEN_HASH,
        pendingKey: null,
        invitedById: 'owner_1',
        acceptedAt: null,
        revokedAt: new Date(),
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 10_000),
        createdAt: new Date(),
      },
    });
    await expect(revoked.service.accept('user_2', { token: TOKEN })).rejects.toThrow(
      new ConflictException('La invitación fue revocada'),
    );
    expect(revoked.rateLimit.registerInviteAcceptFailure).not.toHaveBeenCalled();

    const expired = createHarness({
      invitation: {
        id: 'inv_1',
        organizationId: 'org_1',
        email: 'invited@cordel.test',
        role: 'MEMBER',
        tokenHash: TOKEN_HASH,
        pendingKey: 'org_1:invited@cordel.test',
        invitedById: 'owner_1',
        acceptedAt: null,
        revokedAt: null,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() - 10_000),
        createdAt: new Date(),
      },
    });
    await expect(expired.service.accept('user_2', { token: TOKEN })).rejects.toThrow(
      new ConflictException('La invitación venció'),
    );
    expect(expired.rateLimit.registerInviteAcceptFailure).not.toHaveBeenCalled();
  });

  it('rechaza con 409 si otro request concurrente ganó el claim atómico dentro de la transacción', async () => {
    const { service } = createHarness({ claimedCount: 0 });

    await expect(service.accept('user_2', { token: TOKEN })).rejects.toThrow(ConflictException);
  });

  it('aplica los límites de miembros por organización y de organizaciones para plan FREE', async () => {
    const fullOrg = createHarness({ orgMemberCount: 10 });
    await expect(fullOrg.service.accept('user_2', { token: TOKEN })).rejects.toThrow(
      new ForbiddenException('La organización alcanzó el límite de miembros'),
    );

    const fullUser = createHarness({ userOrgCount: 3 });
    await expect(fullUser.service.accept('user_2', { token: TOKEN })).rejects.toThrow(
      new ForbiddenException('Alcanzaste el límite de organizaciones de tu plan'),
    );
  });
});

describe('InvitationsService.create', () => {
  it('sustituye una invitación vencida y guarda solo el hash con pendingKey', async () => {
    const { service, prisma, queue, audit } = createHarness({ expiredCount: 1 });

    const result = await service.create('acme', 'owner_1', {
      email: 'invited@cordel.test',
      role: 'ADMIN',
    });

    expect(prisma.invitation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org_1',
          email: 'invited@cordel.test',
          acceptedAt: null,
          revokedAt: null,
          expiresAt: expect.objectContaining({ lte: expect.any(Date) }),
        }),
        data: { revokedAt: expect.any(Date), pendingKey: null },
      }),
    );
    expect(prisma.invitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          pendingKey: 'org_1:invited@cordel.test',
          tokenHash: createHash('sha256').update(result.token).digest('hex'),
          sentAt: expect.any(Date),
        }),
      }),
    );
    expect(result.token.length).toBeGreaterThan(20);
    expect(result.organizationId).toBe('org_1');
    expect(queue.add).toHaveBeenCalledWith(
      'invitation',
      expect.objectContaining({
        to: 'invited@cordel.test',
        token: result.token,
        acceptUrl: `http://localhost:3000/invitations?token=${encodeURIComponent(result.token)}`,
      }),
      expect.any(Object),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'INVITATION_CREATED' }),
    );
  });

  it('rechaza una segunda invitación pendiente vigente', async () => {
    const pending: InvitationRowState = {
      id: 'inv_pending',
      organizationId: 'org_1',
      email: 'invited@cordel.test',
      role: 'MEMBER',
      tokenHash: 'hash',
      pendingKey: 'org_1:invited@cordel.test',
      invitedById: 'owner_1',
      acceptedAt: null,
      revokedAt: null,
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + 86_400_000),
      createdAt: new Date(),
    };
    const { service, prisma } = createHarness({ pendingInvitation: pending });

    await expect(
      service.create('acme', 'owner_1', { email: 'invited@cordel.test', role: 'MEMBER' }),
    ).rejects.toThrow(new ConflictException('Ya hay una invitación pendiente para ese email'));
    expect(prisma.invitation.create).not.toHaveBeenCalled();
  });

  it('traduce la violación de unicidad concurrente de pendingKey a 409', async () => {
    const createError = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.10.0',
      meta: { target: ['pendingKey'] },
    });
    const { service } = createHarness({ createError });

    await expect(
      service.create('acme', 'owner_1', { email: 'invited@cordel.test', role: 'MEMBER' }),
    ).rejects.toThrow(new ConflictException('Ya hay una invitación pendiente para ese email'));
  });

  it('rechaza si el correo ya es miembro o la organización llegó al límite', async () => {
    const member = createHarness({
      existingMemberUser: { id: 'user_2', email: 'invited@cordel.test' },
      existingMembership: { userId: 'user_2', organizationId: 'org_1' },
    });
    await expect(
      member.service.create('acme', 'owner_1', { email: 'invited@cordel.test', role: 'MEMBER' }),
    ).rejects.toThrow(new ConflictException('Ya es miembro de la organización'));

    const full = createHarness({ orgMemberCount: 10 });
    await expect(
      full.service.create('acme', 'owner_1', { email: 'invited@cordel.test', role: 'MEMBER' }),
    ).rejects.toThrow(new ForbiddenException('La organización alcanzó el límite de miembros'));
  });
});

describe('InvitationsService.resend', () => {
  it('regenera el token, extiende la vigencia, reenvía el correo y audita sin exponer el token', async () => {
    const { service, prisma, queue, audit } = createHarness();

    const result = await service.resend('acme', 'inv_1', 'user_2');

    expect(result.token).not.toBe(TOKEN);
    expect(prisma.invitation.update).toHaveBeenCalledWith({
      where: { id: 'inv_1' },
      data: {
        tokenHash: createHash('sha256').update(result.token).digest('hex'),
        pendingKey: 'org_1:invited@cordel.test',
        sentAt: expect.any(Date),
        expiresAt: expect.any(Date),
      },
    });
    expect(queue.add).toHaveBeenCalledWith(
      'invitation',
      expect.objectContaining({
        token: result.token,
        acceptUrl: `http://localhost:3000/invitations?token=${encodeURIComponent(result.token)}`,
      }),
      expect.any(Object),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'INVITATION_RESENT', actorId: 'user_2' }),
    );
    const metadata = (audit.record as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]
      ?.metadata as Record<string, unknown>;
    expect(metadata).not.toHaveProperty('token');
  });

  it('permite reenviar una invitación vencida', async () => {
    const { service } = createHarness({
      invitation: {
        id: 'inv_1',
        organizationId: 'org_1',
        email: 'invited@cordel.test',
        role: 'MEMBER',
        tokenHash: TOKEN_HASH,
        pendingKey: 'org_1:invited@cordel.test',
        invitedById: 'owner_1',
        acceptedAt: null,
        revokedAt: null,
        sentAt: new Date(Date.now() - 8 * 86_400_000),
        expiresAt: new Date(Date.now() - 86_400_000),
        createdAt: new Date(Date.now() - 8 * 86_400_000),
      },
    });

    await expect(service.resend('acme', 'inv_1', 'user_2')).resolves.toMatchObject({
      id: 'inv_1',
    });
  });

  it('rechaza reenviar una invitación aceptada o revocada', async () => {
    const accepted = createHarness({
      invitation: {
        id: 'inv_1',
        organizationId: 'org_1',
        email: 'invited@cordel.test',
        role: 'MEMBER',
        tokenHash: TOKEN_HASH,
        pendingKey: null,
        invitedById: 'owner_1',
        acceptedAt: new Date(),
        revokedAt: null,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 10_000),
        createdAt: new Date(),
      },
    });
    await expect(accepted.service.resend('acme', 'inv_1', 'user_2')).rejects.toThrow(
      new ConflictException('La invitación ya fue aceptada'),
    );

    const revoked = createHarness({
      invitation: {
        id: 'inv_1',
        organizationId: 'org_1',
        email: 'invited@cordel.test',
        role: 'MEMBER',
        tokenHash: TOKEN_HASH,
        pendingKey: null,
        invitedById: 'owner_1',
        acceptedAt: null,
        revokedAt: new Date(),
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 10_000),
        createdAt: new Date(),
      },
    });
    await expect(revoked.service.resend('acme', 'inv_1', 'user_2')).rejects.toThrow(
      new ConflictException('La invitación fue revocada'),
    );
  });

  it('devuelve 404 si la invitación no pertenece a la organización', async () => {
    const { service } = createHarness({ invitation: null });
    await expect(service.resend('acme', 'inv_1', 'user_2')).rejects.toThrow(
      new NotFoundException('Invitación no encontrada'),
    );
  });
});
