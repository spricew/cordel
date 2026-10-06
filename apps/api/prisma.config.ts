import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        url: process.env["DATABASE_URL"],
        // Mesa de trabajo de Prisma: aquí construye el schema futuro para
        // calcular el SQL de cada migración. Nunca guarda datos reales.
        // `migrate dev` la gestiona sola en una terminal interactiva;
        // se declara por nombre porque el flujo no-interactivo
        // (`migrate diff` + `migrate deploy`, usado en automatización y CI)
        // la exige explícita. Ver SHADOW_DATABASE_URL en .env.example.
        shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
    },
});