import { z } from 'zod';

// Valida las variables de entorno al arrancar (ver .env.example).
// Se enchufa en `ConfigModule.forRoot({ validationSchema: envSchema })`
// (ver Fase C, registro en app.module.ts). Si algo no cuadra, Nest no
// arranca: fallar al inicio es mejor que fallar con datos a medias.
// * Todo llega como string desde process.env, por eso los números usan coerce.
export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  SHADOW_DATABASE_URL: z.string().startsWith('postgresql://').optional(),
  FREE_MAX_ORGANIZATIONS_PER_USER: z.coerce.number().int().positive().default(3),
  FREE_MAX_MEMBERS_PER_ORGANIZATION: z.coerce.number().int().positive().default(10),
  // Redis para BullMQ (colas de trabajos) y rate limiting. Sin Redis
  // la API no arranca — es infraestructura base, no opcional.
  REDIS_URL: z.string().startsWith('redis://').default('redis://127.0.0.1:6379'),
  // SMTP para emails reales. Si falta SMTP_HOST se usa el modo
  // desarrollo: los emails se escriben como .txt en storage/emails.
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(3).optional(),
  SEED_PASSWORD: z.string().min(8).optional(),
});

export type Env = z.infer<typeof envSchema>;
