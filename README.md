# Cordel

Gestión de equipos y tareas con multi-tenancy estricto.

Cordel es una plataforma para organizar el trabajo en equipo. Una misma persona puede ser dueña de varias organizaciones y tener **roles distintos en cada una** (Owner, Admin, Member). Dentro de cada organización hay equipos, y dentro de cada equipo tareas y subtareas. El aislamiento de datos es estricto: un miembro de un equipo no ve los datos de otro equipo aunque pertenezca a la misma organización.

## ¿Qué hay dentro?

| Paquete | Ruta | Qué es | Puerto |
| --- | --- | --- | --- |
| `@cordel/api` | `apps/api/` | Backend NestJS 12 sobre ESM | `3001` |
| `@cordel/web` | `apps/web/` | Frontend Next.js 16 + React 19 | `3000` |
| `@cordel/types` | `packages/types/` | Tipos compartidos API ↔ frontend | — |

## Estructura del repositorio

```
cordel/
├── apps/
│   ├── api/                  # Backend NestJS 12 (Prisma, PostgreSQL, Vitest)
│   │   ├── src/
│   │   │   ├── auth/         # registro, login, logout, me
│   │   │   ├── organizations/# organizaciones (tenant) y miembros
│   │   │   ├── teams/        # equipos, miembros y permisos efectivos
│   │   │   ├── roles/        # matriz de permisos por rol
│   │   │   ├── health/       # health check
│   │   │   ├── common/       # filtros globales de excepciones
│   │   │   ├── config/       # validación de variables de entorno (Zod)
│   │   │   └── prisma/       # cliente Prisma
│   │   ├── prisma/           # schema.prisma, migraciones y seed
│   │   ├── test/             # pruebas e2e
│   │   ├── .env.example      # plantilla de variables de entorno
│   │   ├── package.json
│   │   └── README.md         # detalle de la API
│   └── web/                  # Frontend Next.js 16 (App Router, Tailwind 4)
│       ├── app/              # rutas (/, /register)
│       ├── components/       # UI y layout
│       ├── package.json
│       └── README.md         # detalle de la web
├── packages/
│   └── types/                # contratos TypeScript compartidos
│       └── src/index.ts
├── docs/
│   └── adr/                  # decision records de arquitectura
│       ├── 001-multi-tenancy-tres-niveles.md
│       ├── 002-rbac-roles-en-dos-niveles.md
│       └── 003-slug-usuario-vs-generado.md
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── prettier.config.mjs
└── README.md
```

## Stack tecnológico

- **API**: NestJS 12, TypeScript (ESM), Prisma ORM, PostgreSQL, Zod, class-validator/class-transformer, bcryptjs, Vitest (unitario + e2e), Supertest
- **Web**: Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- **Compartido**: `@cordel/types` — interfaces reutilizadas por API y frontend
- **Monorepo**: pnpm 12 con workspaces (`apps/*`, `packages/*`)
- **Formato**: Prettier + ESLint

## Comandos útiles

### Desde la raíz del monorepo

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Levanta API y web en paralelo (watch mode) |
| `pnpm dev:api` | Levanta solo la API en watch (puerto 3001) |
| `pnpm dev:web` | Levanta solo la web en watch |
| `pnpm build` | Compila todos los paquetes |
| `pnpm typecheck` | Verificación de tipos en todos los paquetes |
| `pnpm test` | Ejecuta todas las pruebas |
| `pnpm lint` | Lint con autofix en todos los paquetes |
| `pnpm format` | Formatea con Prettier |
| `pnpm format:check` | Revisa que el formato esté correcto |

### Por paquete (filtro)

| Comando | Qué hace |
| --- | --- |
| `pnpm --filter api build` | Compila la API a `dist/` |
| `pnpm --filter api test` | Pruebas unitarias de la API |
| `pnpm --filter api test:e2e` | Pruebas e2e de la API |
| `pnpm --filter api typecheck` | Verificación de tipos de la API |
| `pnpm --filter api db:generate` | Genera el cliente Prisma |
| `pnpm --filter api db:migrate` | Aplica migraciones de Prisma |
| `pnpm --filter api db:seed` | Ejecuta el seed de desarrollo |
| `pnpm --filter api db:studio` | Abre Prisma Studio |
| `pnpm --filter web build` | Compila la web para producción |
| `pnpm --filter web typecheck` | Verificación de tipos de la web |

## Primeros pasos

```bash
# 1. Instala dependencias
pnpm install

# 2. Configura las variables de entorno de la API
cp apps/api/.env.example apps/api/.env
# Edita DATABASE_URL (y las demás si lo necesitas)

# 3. Prepara la base de datos
pnpm --filter api db:generate   # genera el cliente Prisma
pnpm --filter api db:migrate    # aplica las migraciones
pnpm --filter api db:seed       # opcional: datos de desarrollo

# 4. Levanta todo en desarrollo
pnpm dev
```

La API queda disponible en `http://localhost:3001/api/v1` y la web en `http://localhost:3000`.

## Endpoints principales de la API

Todas las rutas van bajo el prefijo global `/api/v1`.

### Autenticación (`/auth`)
| Método | Ruta | Qué hace |
| --- | --- | --- |
| `POST` | `/auth/register` | Registra un nuevo usuario |
| `POST` | `/auth/login` | Inicia sesión y devuelve token de sesión |
| `POST` | `/auth/logout` | Cierra sesión (invalida el token) |
| `GET` | `/auth/me` | Devuelve el usuario autenticado |

### Organizaciones (`/organizations`)
| Método | Ruta | Qué hace |
| --- | --- | --- |
| `GET` | `/organizations` | Lista las organizaciones del usuario |
| `GET` | `/organizations/:slug` | Obtiene una organización por su slug |
| `GET` | `/organizations/:slug/members` | Miembros de una organización |
| `POST` | `/organizations` | Crea una organización |

### Equipos (`/organizations/:slug/teams`)
| Método | Ruta | Qué hace |
| --- | --- | --- |
| `POST` | `/teams` | Crea un equipo dentro de la organización |
| `GET` | `/teams` | Lista los equipos de la organización |
| `GET` | `/teams/:teamSlug` | Obtiene un equipo por su slug |
| `GET` | `/teams/:teamSlug/members` | Miembros del equipo |
| `GET` | `/teams/:teamSlug/effective-role` | Permisos efectivos del usuario en el equipo |

### Salud (`/health`)
| Método | Ruta | Qué hace |
| --- | --- | --- |
| `GET` | `/health` | Verifica que la API y PostgreSQL respondan |

## Arquitectura y decisiones clave

Cordel documenta sus decisiones de diseño en [`docs/adr/`](./docs/adr/):

- **ADR 001 — Multi-tenancy de tres niveles**: `Organization → Team → Task → Subtask`. El aislamiento de datos es estricto por equipo, apoyado por una clave foránea compuesta en PostgreSQL.
- **ADR 002 — RBAC con roles en dos niveles**: `OWNER`, `ADMIN`, `MEMBER`. El rol es una relación usuario→organización y usuario→equipo; el rol de equipo tiene precedencia.
- **ADR 003 — El slug lo elige el usuario**: el slug se valida en el servidor con la regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` y nunca se genera automáticamente.

## Notas técnicas

- El puerto de la API es configurable con la variable `PORT` (por defecto `3001`).
- Las pruebas de la API no usan SWC: el transformador `vite.plugin-tsc.ts` compila con el mismo `tsc` que `nest build`, porque los binarios nativos de SWC no cargan en esta máquina y esbuild no emite `emitDecoratorMetadata` (requerido por NestJS).
- Las variables de entorno se validan con Zod al arranque; si algo falta o está mal, la API no levanta.

## Licencia

UNLICENSED (propietario).