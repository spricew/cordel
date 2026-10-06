import { z } from "zod";

// Valida las variables de entorno al arrancar (ver .env.example).
// Se enchufa en `ConfigModule.forRoot({ validationSchema: envSchema })`
// (ver Fase C, registro en app.module.ts). Si algo no cuadra, Nest no
// arranca: fallar al inicio es mejor que fallar con datos a medias.
// * Todo llega como string desde process.env, por eso los números usan coerce.
export const envSchema = z.object({
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().startsWith("postgresql://"),
    SHADOW_DATABASE_URL: z.string().startsWith("postgresql://").optional(),
    FREE_MAX_ORGANIZATIONS_PER_USER: z.coerce
        .number()
        .int()
        .positive()
        .default(3),
    FREE_MAX_MEMBERS_PER_ORGANIZATION: z.coerce
        .number()
        .int()
        .positive()
        .default(10),
});

export type Env = z.infer<typeof envSchema>;
