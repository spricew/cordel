import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Redis } from 'ioredis';
import { createHash } from 'node:crypto';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { REDIS_CONNECTION } from '../src/queue/queue.tokens.js';

/* supertest (superagent) tipa body como `any`: las peticiones de este
 * archivo lo consumen con aserciones concretas, nunca lo propagamos. */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-argument */

const PASSWORD = 'Invitar-2026!';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function registerAndLogin(
  server: Server,
  email: string,
  name: string,
): Promise<{ id: string; token: string }> {
  const reg = await request(server)
    .post('/api/v1/auth/register')
    .send({ email, name, password: PASSWORD });
  const login = await request(server)
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD });
  return { id: reg.body.id as string, token: login.body.token as string };
}

describe('Invitaciones y aceptación segura (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;
  let server: Server;

  const ts = Date.now().toString(36);
  const prefix = `inv-${ts}`;
  const orgSlug = `${prefix}-org`;

  let ownerId: string;
  let ownerToken: string;
  let inviteeId: string;
  let inviteeEmail: string;
  let inviteeToken: string;
  let rivalId: string;
  let rivalToken: string;
  let bruteId: string;
  let bruteToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
    redis = app.get<Redis>(REDIS_CONNECTION);

    const owner = await registerAndLogin(server, `${prefix}-owner@cordel.test`, 'Owner Inv');
    ownerId = owner.id;
    ownerToken = owner.token;

    inviteeEmail = `${prefix}-invitee@cordel.test`;
    const invitee = await registerAndLogin(server, inviteeEmail, 'Invitee Inv');
    inviteeId = invitee.id;
    inviteeToken = invitee.token;

    const rival = await registerAndLogin(server, `${prefix}-rival@cordel.test`, 'Rival Inv');
    rivalId = rival.id;
    rivalToken = rival.token;

    const brute = await registerAndLogin(server, `${prefix}-brute@cordel.test`, 'Brute Inv');
    bruteId = brute.id;
    bruteToken = brute.token;

    await request(server)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Org Invitaciones', slug: orgSlug });
  });

  afterAll(async () => {
    await redis.del(
      `rl:invite-accept:${ownerId}`,
      `rl:invite-accept:${inviteeId}`,
      `rl:invite-accept:${rivalId}`,
      `rl:invite-accept:${bruteId}`,
    );

    await prisma.auditLog.deleteMany({
      where: { organization: { slug: { startsWith: prefix } } },
    });
    await prisma.notification.deleteMany({
      where: { user: { email: { startsWith: prefix } } },
    });
    await prisma.invitation.deleteMany({
      where: { organization: { slug: { startsWith: prefix } } },
    });
    await prisma.membership.deleteMany({
      where: { organization: { slug: { startsWith: prefix } } },
    });
    await prisma.session.deleteMany({
      where: { user: { email: { startsWith: prefix } } },
    });
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: prefix } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: prefix } },
    });
    await app.close();
  });

  it('sin sesión: 401 al aceptar invitación', async () => {
    const res = await request(server)
      .post('/api/v1/me/invitations/accept')
      .send({ token: 'cualquier-token' });

    expect(res.status).toBe(401);
  });

  it('rechaza tokens vacíos o campos extras no permitidos: 400', async () => {
    const empty = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ token: '   ' });
    const extra = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ token: 'abc', organizationSlug: orgSlug });

    expect(empty.status).toBe(400);
    expect(extra.status).toBe(400);
  });

  it('no filtra existencia ni estado de invitaciones ajenas (404 idéntico)', async () => {
    const created = await request(server)
      .post(`/api/v1/organizations/${orgSlug}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeEmail, role: 'ADMIN' });
    expect(created.status).toBe(201);
    const tokenPending = created.body.token as string;
    const invitationId = created.body.id as string;

    // 1. Token inexistente
    const ghost = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${rivalToken}`)
      .send({ token: 'token-que-no-existe-en-la-base' });

    // 2. Token pendiente válido pero dirigido a invitee (no a rival)
    const foreignPending = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${rivalToken}`)
      .send({ token: tokenPending });

    // 3. Revocamos y probamos como rival otra vez
    await request(server)
      .delete(`/api/v1/organizations/${orgSlug}/invitations/${invitationId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const foreignRevoked = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${rivalToken}`)
      .send({ token: tokenPending });

    expect(ghost.status).toBe(404);
    expect(foreignPending.status).toBe(404);
    expect(foreignRevoked.status).toBe(404);
    expect(foreignPending.body.message).toBe(ghost.body.message);
    expect(foreignRevoked.body.message).toBe(ghost.body.message);
    expect(Object.keys(foreignPending.body).sort()).toEqual(Object.keys(ghost.body).sort());

    // Limpia la invitación revocada de prueba para el siguiente caso
    await prisma.invitation.delete({ where: { id: invitationId } });
  });

  it('rechaza invitación propia revocada o vencida con 409', async () => {
    const revokedRow = await prisma.invitation.create({
      data: {
        organizationId: (await prisma.organization.findUniqueOrThrow({ where: { slug: orgSlug } }))
          .id,
        email: inviteeEmail,
        role: 'MEMBER',
        tokenHash: hashToken(`${prefix}-revoked-tok`),
        pendingKey: null,
        invitedById: ownerId,
        revokedAt: new Date(),
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    const expiredRow = await prisma.invitation.create({
      data: {
        organizationId: revokedRow.organizationId,
        email: inviteeEmail,
        role: 'MEMBER',
        tokenHash: hashToken(`${prefix}-expired-tok`),
        pendingKey: `${revokedRow.organizationId}:${inviteeEmail}`,
        invitedById: ownerId,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const resRevoked = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ token: `${prefix}-revoked-tok` });
    const resExpired = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ token: `${prefix}-expired-tok` });

    expect(resRevoked.status).toBe(409);
    expect(resRevoked.body.message).toBe('La invitación fue revocada');
    expect(resExpired.status).toBe(409);
    expect(resExpired.body.message).toBe('La invitación venció');

    await prisma.invitation.deleteMany({
      where: { id: { in: [revokedRow.id, expiredRow.id] } },
    });
  });

  it('reenvía una invitación, invalida el token anterior y no expone tokens en el listado', async () => {
    const created = await request(server)
      .post(`/api/v1/organizations/${orgSlug}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeEmail, role: 'MEMBER' });
    expect(created.status).toBe(201);
    const oldToken = created.body.token as string;
    const invitationId = created.body.id as string;

    const list = await request(server)
      .get(`/api/v1/organizations/${orgSlug}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(list.status).toBe(200);
    expect((list.body as Array<Record<string, unknown>>).every((row) => !('token' in row))).toBe(
      true,
    );

    const resent = await request(server)
      .post(`/api/v1/organizations/${orgSlug}/invitations/${invitationId}/resend`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(resent.status).toBe(200);
    const newToken = resent.body.token as string;
    expect(newToken).not.toBe(oldToken);

    const oldAttempt = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ token: oldToken });
    expect(oldAttempt.status).toBe(404);

    // Limpia para no alterar el flujo de aceptación posterior.
    await request(server)
      .delete(`/api/v1/organizations/${orgSlug}/invitations/${invitationId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
  });

  it('permite reinvitar tras el vencimiento y revoca la invitación anterior', async () => {
    const first = await request(server)
      .post(`/api/v1/organizations/${orgSlug}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeEmail, role: 'MEMBER' });
    expect(first.status).toBe(201);
    const firstId = first.body.id as string;

    await prisma.invitation.update({
      where: { id: firstId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const second = await request(server)
      .post(`/api/v1/organizations/${orgSlug}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeEmail, role: 'MEMBER' });
    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(firstId);

    const previous = await prisma.invitation.findUniqueOrThrow({ where: { id: firstId } });
    expect(previous.revokedAt).not.toBeNull();
    expect(previous.pendingKey).toBeNull();

    await prisma.invitation.deleteMany({
      where: { id: { in: [firstId, second.body.id as string] } },
    });
  });

  it('serializa dos creaciones simultáneas para el mismo correo', async () => {
    const send = () =>
      request(server)
        .post(`/api/v1/organizations/${orgSlug}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: inviteeEmail, role: 'MEMBER' });

    const [first, second] = await Promise.all([send(), send()]);
    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);

    const createdId = String(first.status === 201 ? first.body.id : second.body.id);
    await prisma.invitation.deleteMany({ where: { id: createdId } });
  });

  it('acepta invitación válida, resiste carrera concurrente, notifica al owner y audita sin token', async () => {
    const created = await request(server)
      .post(`/api/v1/organizations/${orgSlug}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: inviteeEmail, role: 'ADMIN' });
    expect(created.status).toBe(201);
    const token = created.body.token as string;

    // Dos peticiones simultáneas con el mismo token: una gana (201), la otra 409 (nunca 500)
    const [first, second] = await Promise.all([
      request(server)
        .post('/api/v1/me/invitations/accept')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({ token: `  ${token}  ` }),
      request(server)
        .post('/api/v1/me/invitations/accept')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({ token }),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);

    const successRes = first.status === 201 ? first : second;
    expect(successRes.body).toMatchObject({
      userId: inviteeId,
      role: 'ADMIN',
      organization: {
        slug: orgSlug,
        name: 'Org Invitaciones',
      },
    });

    // Reintentar después de aceptada siempre devuelve 409
    const replay = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${inviteeToken}`)
      .send({ token });
    expect(replay.status).toBe(409);
    expect(replay.body.message).toBe('La invitación ya fue aceptada');

    // Invitado ahora ve la org en su listado
    const orgs = await request(server)
      .get('/api/v1/organizations')
      .set('Authorization', `Bearer ${inviteeToken}`);
    expect(orgs.status).toBe(200);
    expect((orgs.body as Array<{ slug: string }>).some((o) => o.slug === orgSlug)).toBe(true);

    // Notificación MEMBER_ADDED al owner
    const notifs = await request(server)
      .get('/api/v1/me/notifications')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(notifs.status).toBe(200);
    expect((notifs.body as Array<{ type: string }>).some((n) => n.type === 'MEMBER_ADDED')).toBe(
      true,
    );

    // Auditoría MEMBER_JOINED sin exponer el token secreto
    const auditLogs = await request(server)
      .get(`/api/v1/organizations/${orgSlug}/audit-logs`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(auditLogs.status).toBe(200);
    const joinedLog = (
      auditLogs.body as Array<{ action: string; metadata: Record<string, unknown> | null }>
    ).find((entry) => entry.action === 'MEMBER_JOINED');
    expect(joinedLog).toBeDefined();
    expect(joinedLog?.metadata).not.toHaveProperty('token');

    // Un usuario ajeno no puede listar ni crear invitaciones en esta org
    const rivalList = await request(server)
      .get(`/api/v1/organizations/${orgSlug}/invitations`)
      .set('Authorization', `Bearer ${rivalToken}`);
    expect(rivalList.status).toBe(404);
  });

  it('bloquea fuerza bruta al aceptar invitaciones con 429 después de 10 fallos', async () => {
    for (let i = 0; i < 10; i += 1) {
      const attempt = await request(server)
        .post('/api/v1/me/invitations/accept')
        .set('Authorization', `Bearer ${bruteToken}`)
        .send({ token: `invalid-attempt-${i}` });
      expect(attempt.status).toBe(404);
    }

    const blocked = await request(server)
      .post('/api/v1/me/invitations/accept')
      .set('Authorization', `Bearer ${bruteToken}`)
      .send({ token: 'invalid-attempt-11' });

    expect(blocked.status).toBe(429);
  });
});
