import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.js";
import { Pool } from "pg";

// La conexión se lee del .env (DATABASE_URL). Este script corre con
// `tsx prisma/seed.ts` fuera de Nest, por eso importa dotenv arriba.
const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
    // upsert: si ya existe no duplica, solo lo deja como está.
    // Así se puede correr el seed cuantas veces se requiera.

    // Dueños: uno por organización, con datos distintos.
    const acmeOwner = await prisma.user.upsert({
        where: { email: "owner@acme.test" },
        update: {},
        create: {
            email: "owner@acme.test",
            name: "Acme Owner",
            plan: "FREE",
        },
    });

    const globexOwner = await prisma.user.upsert({
        where: { email: "owner@globex.test" },
        update: {},
        create: {
            email: "owner@globex.test",
            name: "Globex Owner",
            plan: "FREE",
        },
    });

    // Organizaciones apuntando a un user real
    await prisma.organization.upsert({
        where: { slug: "acme" },
        update: { ownerId: acmeOwner.id },
        create: {
            name: "Acme",
            slug: "acme",
            ownerId: acmeOwner.id,
        },
    });

    await prisma.organization.upsert({
        where: { slug: "globex" },
        update: { ownerId: globexOwner.id },
        create: {
            name: "Globex",
            slug: "globex",
            ownerId: globexOwner.id,
        },
    });

    console.log("Seed OK: 2 usuarios + 2 organizaciones (acme, globex)");
}

try {
    await main();
} finally {
    await prisma.$disconnect();
    await pool.end();
}
