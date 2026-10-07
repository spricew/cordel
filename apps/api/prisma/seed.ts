import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.js";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

// La conexión se lee del .env (DATABASE_URL). Este script corre con
// `tsx prisma/seed.ts` fuera de Nest, por eso importa dotenv arriba.
const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
    // upsert: si ya existe no duplica, solo lo deja como está.
    // Así se puede correr el seed cuantas veces se requiera.
    // Los ids fijos ("seed-...") hacen repetibles los modelos sin
    // campo único propio (Task, Subtask, Comment, ...).

    const seedPassword = process.env["SEED_PASSWORD"];
    if (seedPassword === undefined || seedPassword === "") {
        throw new Error("Missing SEED_PASSWORD in .env");
    }
    const passwordHash = await bcrypt.hash(seedPassword, 10);
    
    // Dueños: uno por organización, con datos distintos.
    const acmeOwner = await prisma.user.upsert({
        where: { email: "owner@acme.test" },
        update: {},
        create: {
            email: "owner@acme.test",
            name: "Acme Owner",
            passwordHash,
            plan: "FREE",
        },
    });

    const globexOwner = await prisma.user.upsert({
        where: { email: "owner@globex.test" },
        update: {},
        create: {
            email: "owner@globex.test",
            name: "Globex Owner",
            passwordHash,
            plan: "FREE",
        },
    });

    // Organizaciones apuntando a sus dueños reales.
    const acme = await prisma.organization.upsert({
        where: { slug: "acme" },
        update: { ownerId: acmeOwner.id },
        create: {
            name: "Acme",
            slug: "acme",
            ownerId: acmeOwner.id,
        },
    });

    const globex = await prisma.organization.upsert({
        where: { slug: "globex" },
        update: { ownerId: globexOwner.id },
        create: {
            name: "Globex",
            slug: "globex",
            ownerId: globexOwner.id,
        },
    });

    // Membresías: cada dueño es OWNER de su organización.
    for (const [userId, organizationId] of [
        [acmeOwner.id, acme.id],
        [globexOwner.id, globex.id],
    ] as const) {
        await prisma.membership.upsert({
            where: { userId_organizationId: { userId, organizationId } },
            update: { role: "OWNER" },
            create: { userId, organizationId, role: "OWNER" },
        });
    }

    // Equipos: uno por organización, con slug para la URL
    // (/acme/desarrollo, /globex/ventas).
    const desarrollo = await prisma.team.upsert({
        where: {
            organizationId_slug: {
                organizationId: acme.id,
                slug: "desarrollo",
            },
        },
        update: {},
        create: {
            organizationId: acme.id,
            name: "Desarrollo",
            slug: "desarrollo",
            description: "Equipo de desarrollo de Acme",
        },
    });

    const ventas = await prisma.team.upsert({
        where: {
            organizationId_slug: {
                organizationId: globex.id,
                slug: "ventas",
            },
        },
        update: {},
        create: {
            organizationId: globex.id,
            name: "Ventas",
            slug: "ventas",
            description: "Equipo de ventas de Globex",
        },
    });

    // Miembros de equipo: cada dueño es OWNER de su equipo.
    for (const [teamId, userId] of [
        [desarrollo.id, acmeOwner.id],
        [ventas.id, globexOwner.id],
    ] as const) {
        await prisma.teamMember.upsert({
            where: { teamId_userId: { teamId, userId } },
            update: { role: "OWNER" },
            create: { teamId, userId, role: "OWNER" },
        });
    }

    // Tareas: una por equipo, asignada a su dueño.
    // Llevan organizationId + teamId (la FK compuesta exige ambos).
    const campana = await prisma.task.upsert({
        where: { id: "seed-task-acme-1" },
        update: {},
        create: {
            id: "seed-task-acme-1",
            organizationId: acme.id,
            teamId: desarrollo.id,
            title: "Migrar la API a NestJS",
            description: "Tarea de ejemplo del seed",
            status: "IN_PROGRESS",
            priority: "HIGH",
            assigneeId: acmeOwner.id,
        },
    });

    await prisma.task.upsert({
        where: { id: "seed-task-globex-1" },
        update: {},
        create: {
            id: "seed-task-globex-1",
            organizationId: globex.id,
            teamId: ventas.id,
            title: "Campaña de Navidad",
            description: "Tarea de ejemplo del seed",
            status: "PENDING",
            priority: "MEDIUM",
            assigneeId: globexOwner.id,
        },
    });

    // Subtareas: dos pasos, el segundo bloqueado y dependiente del primero.
    await prisma.subtask.upsert({
        where: { id: "seed-subtask-acme-1" },
        update: {},
        create: {
            id: "seed-subtask-acme-1",
            taskId: campana.id,
            title: "Diseñar la interfaz",
            status: "DONE",
            priority: "MEDIUM",
            position: 1,
        },
    });

    await prisma.subtask.upsert({
        where: { id: "seed-subtask-acme-2" },
        update: {},
        create: {
            id: "seed-subtask-acme-2",
            taskId: campana.id,
            title: "Codificar el diseño",
            status: "BLOCKED",
            priority: "HIGH",
            blockedReason: "Falta el acceso a Figma",
            blockedAt: new Date("2026-10-01T00:00:00.000Z"),
            position: 2,
        },
    });

    await prisma.subtaskDependency.upsert({
        where: {
            subtaskId_dependsOnSubtaskId: {
                subtaskId: "seed-subtask-acme-2",
                dependsOnSubtaskId: "seed-subtask-acme-1",
            },
        },
        update: {},
        create: {
            subtaskId: "seed-subtask-acme-2",
            dependsOnSubtaskId: "seed-subtask-acme-1",
        },
    });

    // Comentario y adjunto sobre la tarea de Acme.
    await prisma.comment.upsert({
        where: { id: "seed-comment-acme-1" },
        update: {},
        create: {
            id: "seed-comment-acme-1",
            organizationId: acme.id,
            teamId: desarrollo.id,
            taskId: campana.id,
            authorId: acmeOwner.id,
            body: "Empezamos con el diseño esta semana.",
        },
    });

    await prisma.attachment.upsert({
        where: { id: "seed-attachment-acme-1" },
        update: {},
        create: {
            id: "seed-attachment-acme-1",
            organizationId: acme.id,
            teamId: desarrollo.id,
            taskId: campana.id,
            fileName: "wireframe.png",
            storageKey: "seed/acme/wireframe.png",
            mimeType: "image/png",
            sizeBytes: 1234,
            uploadedById: acmeOwner.id,
        },
    });

    // Notificación para el dueño de Acme.
    await prisma.notification.upsert({
        where: { id: "seed-notification-acme-1" },
        update: {},
        create: {
            id: "seed-notification-acme-1",
            organizationId: acme.id,
            teamId: desarrollo.id,
            userId: acmeOwner.id,
            type: "TASK_ASSIGNED",
            title: "Tarea asignada",
            body: "Se te asignó Migrar la API a NestJS.",
            taskId: campana.id,
        },
    });

    console.log("Seed OK: 2 usuarios, 2 orgs, equipos, tareas y más");
}

try {
    await main();
} finally {
    await prisma.$disconnect();
    await pool.end();
}
