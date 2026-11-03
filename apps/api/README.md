# API de Cordel

Backend de Cordel. NestJS 12 sobre ESM, con TypeScript, Prisma + PostgreSQL, Vitest para pruebas unitarias y e2e, y Zod para validación de variables de entorno.

La API expone todas sus rutas bajo el prefijo global `/api/v1` y sigue una arquitectura modular por dominio (`auth`, `organizations`, `teams`, `roles`, `health`, `common`, `config`, `prisma`).

## Stack

| Tecnología | Versión | Uso |
| --- | --- | --- |
| NestJS | 12 | Framework backend |
| TypeScript | 5.9 | Lenguaje (ESM) |
| Prisma | 7.10 | ORM y migraciones |
| PostgreSQL | — | Base de datos |
| Zod | 4.6 | Validación de entorno y esquemas |
| class-validator / class-transformer | — | Validación y transformación de DTOs |
| bcryptjs | 3.0 | Hash de contraseñas |
| Vitest | 5.0 | Pruebas unitarias y e2e |
| Supertest | 7.0 | Pruebas HTTP de integración |

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev:api` | Levanta la API en watch mode (puerto 3001) |
| `pnpm --filter api build` | Compila a `dist/` |
| `pnpm --filter api start` | Levanta la API compilada |
| `pnpm --filter api start:prod` | Levanta en producción desde `dist/src/main.js` |
| `pnpm --filter api test` | Pruebas unitarias |
| `pnpm --filter api test:e2e` | Pruebas e2e |
| `pnpm --filter api test:watch` | Pruebas unitarias en watch |
| `pnpm --filter api test:cov` | Pruebas con cobertura |
| `pnpm --filter api typecheck` | Verificación de tipos |
| `pnpm --filter api lint` | ESLint con autofix |
| `pnpm --filter api format` | Prettier sobre `src/` y `test/` |
| `pnpm --filter api db:generate` | Genera el cliente Prisma |
| `pnpm --filter api db:migrate` | Aplica migraciones de Prisma |
| `pnpm --filter api db:seed` | Ejecuta el seed de desarrollo |
| `pnpm --filter api db:studio` | Abre Prisma Studio |

## Estructura interna

```
apps/api/
├── src/
│   ├── app.module.ts         # Módulo raíz
│   ├── app.controller.ts     # Endpoint raíz
│   ├── app.service.ts
│   ├── main.ts               # Bootstrap (prefijo /api/v1, pipes globales, filtros, shutdown hooks)
│   ├── auth/                 # registro, login, logout, me (guard de sesión global)
│   ├── organizations/        # organizaciones (tenant), miembros
│   ├── teams/                # equipos, miembros, permisos efectivos
│   ├── roles/                # matriz de permisos por rol (ADR 002)
│   ├── health/               # health check de API y base de datos
│   ├── common/               # filtros globales de excepciones
│   ├── config/               # validación de variables de entorno (Zod)
│   └── prisma/               # cliente Prisma (módulo y servicio)
├── prisma/
│   ├── schema.prisma         # modelo de datos (multi-tenancy 3 niveles)
│   ├── migrations/           # migraciones
│   └── seed.ts               # seed de desarrollo
├── test/                     # pruebas e2e (*.e2e-spec.ts)
├── .env.example              # plantilla de variables de entorno
├── vite.plugin-tsc.ts        # transformador Vitest basado en tsc (no SWC)
├── vitest.config.ts          # configuración pruebas unitarias
├── vitest-e2e.config.ts      # configuración pruebas e2e
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── package.json
```

## Variables de entorno

Copia `.env.example` a `.env` y edítalo:

```
PORT=3001
FREE_MAX_ORGANIZATIONS_PER_USER=3
FREE_MAX_MEMBERS_PER_ORGANIZATION=10
DATABASE_URL="postgresql://username:password@localhost:5433/database"
SHADOW_DATABASE_URL="postgresql://username:password@localhost:5433/shadow_database"
SEED_PASSWORD="choose-a-dev-password-min-8-chars"
```

| Variable | Qué es | Default |
| --- | --- | --- |
| `PORT` | Puerto de la API | `3001` |
| `DATABASE_URL` | Conexión a PostgreSQL (requerida) | — |
| `SHADOW_DATABASE_URL` | Base de sombra para migraciones Prisma | opcional |
| `FREE_MAX_ORGANIZATIONS_PER_USER` | Límite plan gratuito: organizaciones por usuario | `3` |
| `FREE_MAX_MEMBERS_PER_ORGANIZATION` | Límite plan gratuito: miembros por organización | `10` |
| `SEED_PASSWORD` | Contraseña para el seed (mínimo 8 caracteres) | opcional |

Las variables se validan con Zod al arranque (`ConfigModule.forRoot({ validationSchema: envSchema })`). Si falta algo o está mal formado, la API no levanta.

## Notas

- El puerto es configurable con la variable `PORT` (por defecto `3001`).
- Las pruebas no usan SWC: el transformador `vite.plugin-tsc.ts` compila con el mismo `tsc` que `nest build`, porque los binarios nativos de SWC no cargan en esta máquina y esbuild no emite `emitDecoratorMetadata` (requerido por NestJS).
- Todos los DTOs entran por un `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`.
- Los errores tienen forma pareja gracias al filtro global `AllExceptionsFilter`.
- La API usa `enableShutdownHooks()` para cerrar Prisma y el pool de conexiones al recibir SIGTERM/SIGINT.

## Endpoints rápidos

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Registra usuario |
| `POST` | `/api/v1/auth/login` | Inicia sesión |
| `POST` | `/api/v1/auth/logout` | Cierra sesión |
| `GET` | `/api/v1/auth/me` | Usuario autenticado |
| `GET` | `/api/v1/organizations` | Mis organizaciones |
| `GET` | `/api/v1/organizations/:slug` | Organización por slug |
| `GET` | `/api/v1/organizations/:slug/members` | Miembros de una organización |
| `POST` | `/api/v1/organizations` | Crear organización |
| `POST` | `/api/v1/organizations/:slug/teams` | Crear equipo |
| `GET` | `/api/v1/organizations/:slug/teams` | Listar equipos |
| `GET` | `/api/v1/organizations/:slug/teams/:teamSlug` | Equipo por slug |
| `GET` | `/api/v1/organizations/:slug/teams/:teamSlug/members` | Miembros del equipo |
| `GET` | `/api/v1/organizations/:slug/teams/:teamSlug/effective-role` | Permisos efectivos |
| `GET` | `/api/v1/health` | Salud de API y base de datos |

Más detalles de arquitectura en [`../docs/adr/`](../docs/adr/):

- **ADR 001** — Multi-tenancy de tres niveles (`Organization → Team → Task → Subtask`)
- **ADR 002** — RBAC con roles en dos niveles (organización + equipo)
- **ADR 003** — El slug lo elige el usuario y se valida en el servidor