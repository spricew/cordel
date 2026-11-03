# Web de Cordel

Frontend de Cordel. Next.js 16 (App Router), React 19, Tailwind CSS 4 y TypeScript.

Esta aplicación consume la API de Cordel (`@cordel/api`) para gestionar organizaciones, equipos, tareas y subtareas. Comparte los contratos de TypeScript con el backend a través del paquete `@cordel/types`.

## Stack

| Tecnología | Versión | Uso |
| --- | --- | --- |
| Next.js | 16.3 | Framework React (App Router) |
| React | 19.2 | Librería de UI |
| Tailwind CSS | 4 | Estilos |
| TypeScript | 5.9 | Tipado |
| ESLint | 9 | Lint (configuración de Next.js) |

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev:web` | Levanta la web en watch mode (puerto 3000 por defecto) |
| `pnpm --filter web dev` | Lo mismo que arriba, desde el filtro |
| `pnpm --filter web build` | Compila para producción |
| `pnpm --filter web start` | Levanta la versión compilada en producción |
| `pnpm --filter web lint` | ESLint |
| `pnpm --filter web typecheck` | Verificación de tipos |

## Estructura interna

```
apps/web/
├── app/
│   ├── layout.tsx         # Layout raíz (idioma, estilos globales)
│   ├── page.tsx           # Página principal (listado y creación de equipos)
│   ├── register/
│   │   └── page.tsx       # Página de registro
│   ├── favicon.ico
│   └── globals.css        # Estilos globales y Tailwind
├── components/
│   ├── layout/            # Componentes de layout (vacío por ahora)
│   └── ui/
│       └── PrimaryInput.tsx # Input base reutilizable
├── next.config.ts         # Configuración de Next.js
├── postcss.config.mjs     # PostCSS (Tailwind 4)
├── tsconfig.json
├── package.json
└── README.md
```

## Variables de entorno

Next.js expone variables al cliente solo si empiezan con `NEXT_PUBLIC_`. Consulta el archivo `.env.example` de la API para la configuración del backend (`DATABASE_URL`, `PORT`, etc.).

Si la web necesita apuntar a una API distinta, define una variable como `NEXT_PUBLIC_API_URL` y úsala en las llamadas de fetch.

## Notas

- La página principal (`/`) muestra un listado de equipos y permite crear nuevos mediante un modal.
- La ruta `/register` existe para el registro de usuarios (conecta con `POST /api/v1/auth/register`).
- Los estilos usan Tailwind CSS 4 (vía PostCSS).
- El proyecto no incluye tests configurados por ahora; los tests de la API viven en `apps/api/`.

## Primeros pasos

Desde la raíz del monorepo:

```bash
# Instala dependencias
pnpm install

# Levanta la web (y la API con pnpm dev:api si la necesitas)
pnpm dev:web
```

La web queda disponible en `http://localhost:3000` y la API en `http://localhost:3001/api/v1`.