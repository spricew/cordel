# ADR 004: Parche local de turbo para evitar el crash nativo en Windows

- Estado: aceptada
- Fecha: 2026-10-02
- Paquete afectado: `turbo@2.10.9` (wrapper `bin/turbo`)

## Contexto

En Windows, todo comando de turbo invocado desde un script de pnpm en una terminal
interactiva terminaba de inmediato con:

```
• turbo 2.10.9
[ELIFECYCLE] Command failed with exit code -1073740791
```

El código `-1073740791` es `0xC0000409` (`STATUS_STACK_BUFFER_OVERRUN`), un
`__fastfail` nativo. El proceso muere antes de ejecutar ninguna tarea: no es un
problema de configuración del monorepo, del código de la aplicación ni del sistema
de archivos. Afectaba por igual a `turbo run typecheck`, `turbo run dev` y
`turbo run dev --filter=...`.

Comandos que no pasan por turbo (`nest start --watch`, `next dev`, `vitest`)
funcionaban con normalidad.

## Investigación

Se aisló el disparador con una matriz 2x2 sobre el binario nativo, separando el
pipe extra de stdio de la variable de entorno:

| pipe extra (fd 3) | `__TURBO_WINDOWS_CTRL_C_FD` | resultado |
| ------------------ | ---------------------------- | --------- |
| no                 | no                          | clean     |
| no                 | sí                          | CRASH     |
| sí                 | no                          | clean     |
| sí                 | sí                          | CRASH     |

Conclusión: **la variable de entorno es necesaria y suficiente** para el crash.
El pipe adicional de stdio es inocuo.

Causa: el wrapper `bin/turbo` (función `shouldOwnWindowsCtrlC`) detecta que
`process.stdin.isTTY` es verdadero en una terminal interactiva y, en ese caso,
spawnea el binario nativo con `__TURBO_WINDOWS_CTRL_C_FD=3` para traspasar el
Ctrl+C. Al recibir esa variable, el binario nativo de turbo aborta con
`0xC0000409`.

El mismo comportamiento se reprodujo con `2.10.9` y con `2.11.7` (última
versión publicada al momento). Actualizar turbo **no** corrige el problema, por
lo que no se fijó la versión.

La presencia de la variable es exactamente lo que distingue el fallo: sin TTY
(`'' | pnpm typecheck`) turbo funciona, lo que descarta la configuración del
proyecto, el estado del repositorio y los binarios instalados como causas.

No se pudo atribuir el fallo a un módulo concreto: Windows no registró eventos
WER (Application Error 1000) para estos crashes, por lo que la hipótesis de un
software de seguridad que inyecta DLLs sigue siendo plausible pero **no
verificada**, y no se documenta como causa establecida.

## Decisión

Aplicar un parche local sobre `bin/turbo` con `pnpm patch`, desactivando la
función `shouldOwnWindowsCtrlC` para que devuelva siempre `false`. El binario
nativo deja de recibir `__TURBO_WINDOWS_CTRL_C_FD` y arranca con normalidad.

Se elige el parche sobre estas alternativas:

- **Actualizar turbo.** Descartado: 2.11.7 falla igual. Fijar la versión habría
  dejado el repo peor (pin innecesario, entradas del lock dentro de la ventana de
  `minimumReleaseAge`) sin resolver nada.
- **Evitar turbo en los scripts de desarrollo.** Descartado: `turbo` sigue siendo
  necesario para `build`, `lint`, `test` y `typecheck`, y los comandos directos
  por paquete no son equivalentes.
- **Redirigir stdin en los scripts.** Descartado: `'' | pnpm typecheck` funciona
  pero no es portable entre shells, no aplica a `dev` (que es interactivo por
  definición) y estropea el prompt.

## Consecuencias

- `Ctrl+C` deja de ser traspasado por el wrapper de Node. En su lugar, turbo
  recibe `SIGINT` directamente, que es el comportamiento nativo esperado. En
  pruebas manuales el cierre con `Ctrl+C` sigue siendo limpio; queda pendiente
  confirmar el cierre con dos `Ctrl+C` consecutivos, habitual en `dev`.
- El parche está atado a `2.10.9`. Si se actualiza turbo, el parche no se aplica
  y hay que volver a evaluar: si upstream lo corrige, el parche debe retirarse
  (borrar la entrada de `patchedDependencies` en `pnpm-workspace.yaml` y el
  archivo en `patches/`).
- Mientras el parche exista, `pnpm install` aplica el parche automáticamente.