import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from '../src/app.module.js';

/* supertest (superagent) tipa body como `any`: las peticiones de este
 * archivo lo consumen con aserciones concretas, nunca lo propagamos. */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* Pruebas de AISLAMIENTO (anti-BOLA) contra la base real, vía supertest.
 *
 * Plantilla de datos: cada corrida crea un tenant propio con slug
 * prefijado `iso-` + timestamp, y al final borra TODO lo creado en orden
 * inverso de llaves foráneas. Nunca toca las filas de demo (acme/globex):
 * los ids son cuid únicos y los slugs llevan el prefijo del test.
 *
 * Mapa de actores (todos de una corrida nueva):
 *   ownerA   OWNER de org A y de equipo A (nace del nested create)
 *   memberB  org A MEMBER + equipo A MEMBER (el usuario común)
 *   visitorC org A MEMBER, sin equipo (miembro de la org y nada más)
 *   adminE   org A MEMBER + equipo A ADMIN (rol efectivo por equipo)
 *   rivalD   OWNER de org B (el vecino de otra organización) */

const PASSWORD = 'Aislar-2026!';

/* Login y token para una corrida; helper plano, sin estado. */
async function loginAndGetToken(httpServer: Server, email: string): Promise<string> {
  const res = await request(httpServer)
    .post('/api/v1/auth/login')
    .send({ email, password: PASSWORD });
  return res.body.token as string;
}

describe('Aislamiento multi-tenant (anti-BOLA)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;

  let orgA: string; // slug (última corrida, no ids)
  let teamA: string;
  let teamB: string;
  let taskA1: string;
  let taskA2: string;

  let tokenOwnerA: string;
  let tokenMemberB: string;
  let tokenVisitorC: string;
  let tokenAdminE: string;
  let tokenRivalD: string;
  let memberBId: string;
  let rivalDId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Réplica del bootstrap de main.ts: sin esto, las rutas probarían
    // otra cosa distinta a la API real (prefijo, validación, errores).
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

    const ts = Date.now().toString(36);
    const emailA = `iso-${ts}-a@cordel.test`;

    // ...org A con OWNER y equipo A vía la API (creación normal).
    await request(server)
      .post('/api/v1/auth/register')
      .send({ email: emailA, name: 'Owner A', password: PASSWORD });
    tokenOwnerA = await loginAndGetToken(server, emailA);
    orgA = `iso-a-${ts}`;
    await request(server)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .send({ name: 'Org Iso A', slug: orgA });
    teamA = `equipo-a-${ts}`;
    await request(server)
      .post(`/api/v1/organizations/${orgA}/teams`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .send({ name: 'Equipo A', slug: teamA });

    const teamAId = (await prisma.team.findFirstOrThrow({ where: { slug: teamA } })).id;
    const orgAId = (await prisma.organization.findFirstOrThrow({ where: { slug: orgA } })).id;

    // Tareas: una por API (con el flujo normal) y otra por prisma
    // (rutas válidas aunque ninguna A tenga que ver con el usuario).
    const taskA1Res = await request(server)
      .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks`)
      .set('Authorization', `Bearer ${tokenOwnerA}`)
      .send({ title: 'Tarea A1' });
    taskA1 = taskA1Res.body.id;
    const taskA2Row = await prisma.task.create({
      data: { organizationId: orgAId, teamId: teamAId, title: 'Tarea A2' },
    });
    taskA2 = taskA2Row.id;

    // ...equipo B de la MISMA org, creado directo en la base: así el
    // owner NO queda como TeamMember y podemos probar que "el rol no
    // otorga acceso" (ADR 002) sin el nested create que lo une.
    const teamBRow = await prisma.team.create({
      data: { organizationId: orgAId, slug: `equipo-b-${ts}`, name: 'Equipo B' },
    });
    teamB = teamBRow.slug;
    const taskB1 = await prisma.task.create({
      data: { organizationId: orgAId, teamId: teamBRow.id, title: 'Tarea B1' },
    });
    await prisma.subtask.create({
      data: { taskId: taskB1.id, title: 'Paso B1', position: 0 },
    });

    // ...actores de org A: memberB (del equipo), visitorC (sin equipo,
    // miembro de la organización y nada más), adminE (ADMIN del equipo).
    // No hay invitaciones todavía, así que las membresías se siembran
    // directo en la base, igual que hará el endpoint de invitaciones.
    const parts: Array<{ suffix: string; teamRole?: 'MEMBER' | 'ADMIN' }> = [
      { suffix: 'b', teamRole: 'MEMBER' },
      { suffix: 'c' },
      { suffix: 'e', teamRole: 'ADMIN' },
    ];
    for (const part of parts) {
      const email = `iso-${ts}-${part.suffix}@cordel.test`;
      const reg = await request(server)
        .post('/api/v1/auth/register')
        .send({ email, name: `User ${part.suffix.toUpperCase()}`, password: PASSWORD });
      const token = await loginAndGetToken(server, email);
      if (part.suffix === 'b') {
        tokenMemberB = token;
        memberBId = reg.body.id;
      } else if (part.suffix === 'c') {
        tokenVisitorC = token;
      } else {
        tokenAdminE = token;
      }
      await prisma.membership.create({
        data: { userId: reg.body.id, organizationId: orgAId, role: 'MEMBER' },
      });
      if (part.teamRole !== undefined) {
        await prisma.teamMember.create({
          data: { userId: reg.body.id, teamId: teamAId, role: part.teamRole },
        });
      }
    }

    // ...org B: un vecino completo, dueño de su propio tenant. Es la
    // figura de "usuario de otra organización" para las pruebas 404.
    const emailD = `iso-${ts}-d@cordel.test`;
    const regD = await request(server)
      .post('/api/v1/auth/register')
      .send({ email: emailD, name: 'Rival D', password: PASSWORD });
    tokenRivalD = await loginAndGetToken(server, emailD);
    rivalDId = regD.body.id;
    await request(server)
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${tokenRivalD}`)
      .send({ name: 'Org Iso B', slug: `iso-b-${ts}` });
  });

  afterAll(async () => {
    // Limpieza en orden INVERSO de llaves foráneas: primero los hijos
    // (dependencias → subtareas → tareas...); las FK opcionales van con
    // SetNull y las requeridas Restrict. El prefijo `iso-` garantiza
    // que solo se borre lo de estos tests, nunca la demo.
    await prisma.subtaskDependency.deleteMany({
      where: {
        OR: [
          { subtask: { task: { team: { organization: { slug: { startsWith: 'iso-' } } } } } },
          { dependsOn: { task: { team: { organization: { slug: { startsWith: 'iso-' } } } } } },
        ],
      },
    });
    await prisma.subtask.deleteMany({
      where: { task: { team: { organization: { slug: { startsWith: 'iso-' } } } } },
    });
    await prisma.task.deleteMany({
      where: { team: { organization: { slug: { startsWith: 'iso-' } } } },
    });
    await prisma.teamMember.deleteMany({
      where: { team: { organization: { slug: { startsWith: 'iso-' } } } },
    });
    await prisma.team.deleteMany({
      where: { organization: { slug: { startsWith: 'iso-' } } },
    });
    await prisma.membership.deleteMany({
      where: { organization: { slug: { startsWith: 'iso-' } } },
    });
    await prisma.session.deleteMany({
      where: { user: { email: { startsWith: 'iso-' } } },
    });
    // Las organizations ANTES de sus usuarios: ownerId es FK restrict.
    await prisma.organization.deleteMany({
      where: { slug: { startsWith: 'iso-' } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'iso-' } },
    });
    await app.close();
  });

  it('sin sesión: 401 en lectura y en escritura', async () => {
    const read = await request(server).get(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks`);
    const write = await request(server)
      .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks`)
      .send({ title: 'Sin sesión' });

    expect(read.status).toBe(401);
    expect(write.status).toBe(401);
  });

  describe('otra organización (BOLA de tenant completo)', () => {
    it('rivalD no ve ni el detalle de la org: 404 idéntico a una fantasma', async () => {
      const foreign = await request(server)
        .get(`/api/v1/organizations/${orgA}`)
        .set('Authorization', `Bearer ${tokenRivalD}`);
      const ghost = await request(server)
        .get('/api/v1/organizations/esta-org-no-existe')
        .set('Authorization', `Bearer ${tokenRivalD}`);

      expect(foreign.status).toBe(404);
      expect(ghost.status).toBe(404);
      // El mismo mensaje y forma: saber que la org existe YA sería una fuga.
      expect(foreign.body.message).toBe(ghost.body.message);
      expect(Object.keys(foreign.body).sort()).toEqual(Object.keys(ghost.body).sort());
    });

    it('rivalD no lista ni escribe tareas de la org ajena: 404', async () => {
      const list = await request(server)
        .get(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks`)
        .set('Authorization', `Bearer ${tokenRivalD}`);
      const create = await request(server)
        .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks`)
        .set('Authorization', `Bearer ${tokenRivalD}`)
        .send({ title: 'Intruso' });
      const patch = await request(server)
        .patch(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}`)
        .set('Authorization', `Bearer ${tokenRivalD}`)
        .send({ title: 'Intruso' });

      expect(list.status).toBe(404);
      expect(create.status).toBe(404);
      expect(patch.status).toBe(404);
      expect(list.body.message).toBe('Organización no encontrada');
    });
  });

  describe('otro equipo de la misma org (BOLA de equipo)', () => {
    it('visitorC ve el equipo (org member) pero NO sus tareas: 403', async () => {
      const team = await request(server)
        .get(`/api/v1/organizations/${orgA}/teams/${teamA}`)
        .set('Authorization', `Bearer ${tokenVisitorC}`);
      const list = await request(server)
        .get(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks`)
        .set('Authorization', `Bearer ${tokenVisitorC}`);
      const detail = await request(server)
        .get(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}`)
        .set('Authorization', `Bearer ${tokenVisitorC}`);

      expect(team.status).toBe(200); // la existencia del equipo no es secreta
      expect(list.status).toBe(403);
      expect(detail.status).toBe(403);
      expect(list.body.message).toBe('No eres miembro de este equipo');
    });

    it('tampoco las subtareas: 403', async () => {
      const subs = await request(server)
        .get(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}/subtasks`)
        .set('Authorization', `Bearer ${tokenVisitorC}`);

      expect(subs.status).toBe(403);
      expect(subs.body.message).toBe('No eres miembro de este equipo');
    });

    it('el rol OWNER de la org NO alcanza el equipo B (no es TeamMember)', async () => {
      // ADR 002: "el rol no otorga acceso por sí solo". El owner de la
      // organización no puede leer el árbol de un equipo al que no
      // pertenece, aunque su rol sea el máximo.
      const list = await request(server)
        .get(`/api/v1/organizations/${orgA}/teams/${teamB}/tasks`)
        .set('Authorization', `Bearer ${tokenOwnerA}`);

      expect(list.status).toBe(403);
      expect(list.body.message).toBe('No eres miembro de este equipo');
    });
  });

  describe('ids de recursos cruzados', () => {
    it('la tarea de OTRO equipo no se lee sin importar el id: 404', async () => {
      // taskB1 vive en equipo B; se pregunta por su id PERO por la ruta
      // de equipo A. La FK compuesta + el filtro por el par (org,equipo)
      // la hacen invisible: no "tarea ajena", "tarea no encontrada".
      const leak = await request(server)
        .get(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA2}`)
        .set('Authorization', `Bearer ${tokenMemberB}`);
      const cross = await prisma.task.findFirstOrThrow({ where: { title: 'Tarea B1' } });
      const readCross = await request(server)
        .get(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${cross.id}`)
        .set('Authorization', `Bearer ${tokenMemberB}`);

      // Estructura interna: memberB pregunta por la tarea A2 (equipo A,
      // dato válido para él): 200. La de equipo B por la ruta de A: 404.
      expect(leak.status).toBe(200);
      expect(readCross.status).toBe(404);
      expect(readCross.body.message).toBe('Tarea no encontrada');
    });

    it('la dependencia que apunta a otra tarea no se puede crear: 400', async () => {
      const subA = await request(server)
        .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}/subtasks`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ title: 'Paso A1' });
      const crossSub = await prisma.subtask.findFirstOrThrow({ where: { title: 'Paso B1' } });
      const dep = await request(server)
        .post(
          `/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}/subtasks/${subA.body.id}/dependencies`,
        )
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ dependsOnSubtaskId: crossSub.id });

      expect(dep.status).toBe(400);
      expect(dep.body.message).toBe('La dependencia debe ser una subtarea de la misma tarea');
    });

    it('escribir la tarea de otro equipo por la ruta propia: 404 (sin fugar)', async () => {
      const cross = await prisma.task.findFirstOrThrow({ where: { title: 'Tarea B1' } });
      const patch = await request(server)
        .patch(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${cross.id}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ title: 'Secuestrada' });

      expect(patch.status).toBe(404);
      expect(patch.body.message).toBe('Tarea no encontrada');
    });
  });

  describe('concesión condicional del responsable (ADR 002)', () => {
    it('owner asigna a memberB (miembro del equipo): 200', async () => {
      const res = await request(server)
        .patch(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ assigneeId: memberBId });

      expect(res.status).toBe(200);
      expect(res.body.assigneeId).toBeTruthy();
    });

    it('memberB (MEMBER) crea subtarea en SU tarea asignada: 201', async () => {
      const res = await request(server)
        .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}/subtasks`)
        .set('Authorization', `Bearer ${tokenMemberB}`)
        .send({ title: 'Paso del responsable' });

      expect(res.status).toBe(201);
      expect(res.body.taskId).toBe(taskA1);
    });

    it('memberB NO crea subtarea en la tarea de otro: 403', async () => {
      const res = await request(server)
        .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA2}/subtasks`)
        .set('Authorization', `Bearer ${tokenMemberB}`)
        .send({ title: 'Paso ajeno' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('No tienes permiso para esta acción');
    });

    it('visitorC (org MEMBER sin equipo) tampoco: 403', async () => {
      const res = await request(server)
        .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}/subtasks`)
        .set('Authorization', `Bearer ${tokenVisitorC}`)
        .send({ title: 'Paso fuera del equipo' });

      expect(res.status).toBe(403);
    });
  });

  describe('escrituras por rol efectivo', () => {
    it('memberB (equipo MEMBER) NO crea tareas: 403', async () => {
      const res = await request(server)
        .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks`)
        .set('Authorization', `Bearer ${tokenMemberB}`)
        .send({ title: 'Tarea prohibida' });

      expect(res.status).toBe(403);
    });

    it('adminE (org MEMBER + equipo ADMIN) SÍ crea tareas: 201', async () => {
      // Rol efectivo: teamRole ADMIN manda aunque la organización diga
      // MEMBER. Es la prueba viva de la precedencia de ADR 002.
      const res = await request(server)
        .post(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks`)
        .set('Authorization', `Bearer ${tokenAdminE}`)
        .send({ title: 'Tarea del equipo' });

      expect(res.status).toBe(201);
      expect(res.body.teamId).toBeTruthy();
    });

    it('adminE NO crea EQUIPOS: acción de organización, su org-role es MEMBER', async () => {
      // team:create se evalúa SIN contexto de equipo (ruta sin teamSlug):
      // el rol efectivo vuelve a ser el de la org (MEMBER) → 403 aunque
      // el administrador del equipo tenga permisos dentro del equipo.
      const res = await request(server)
        .post(`/api/v1/organizations/${orgA}/teams`)
        .set('Authorization', `Bearer ${tokenAdminE}`)
        .send({ name: 'Equipo Prohibido', slug: `equipo-claro-${Date.now()}` });

      expect(res.status).toBe(403);
    });
  });

  describe('el responsable debe ser miembro del equipo', () => {
    it('asignar a un usuario de OTRA org: 400', async () => {
      // rivalD no es TeamMember de equipo A (ni de org A): la regla del
      // responsable evita que el asignado se quede sin acceso de lectura.
      const res = await request(server)
        .patch(`/api/v1/organizations/${orgA}/teams/${teamA}/tasks/${taskA1}`)
        .set('Authorization', `Bearer ${tokenOwnerA}`)
        .send({ assigneeId: rivalDId });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('El responsable debe ser miembro del equipo');
    });
  });
});
