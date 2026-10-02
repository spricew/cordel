# API

Backend de Cordel. NestJS 12 sobre ESM, con Vitest para pruebas unitarias y e2e.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev:api` | Levanta la API en watch mode (puerto 3001) |
| `pnpm --filter api build` | Compila a `dist/` |
| `pnpm --filter api test` | Pruebas unitarias |
| `pnpm --filter api test:e2e` | Pruebas e2e |
| `pnpm --filter api typecheck` | Verificación de tipos |

## Notas

- El puerto es configurable con la variable `PORT` (por defecto `3001`).
- Las pruebas no usan SWC: el transformador `vite.plugin-tsc.ts` compila con el
  mismo `tsc` que `nest build`, porque los binarios nativos de SWC no cargan en
  esta máquina y esbuild no emite `emitDecoratorMetadata` (requerido por NestJS).