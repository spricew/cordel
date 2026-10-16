# ADR 002: RBAC con roles en dos niveles

- **Fecha:** 2026-10-01
- **Ámbito:** Autorización y modelo de datos
- **Relacionado:** [ADR 001](001-multi-tenancy-tres-niveles.md)

## Contexto

Cordel define tres roles: `OWNER`, `ADMIN` y `MEMBER`.

El requisito central es que **el rol no es una propiedad del usuario**:

> El rol no debe considerarse una propiedad global del usuario, sino una relación entre
> el usuario y el equipo.

Y la consecuencia práctica es que una persona debe poder tener roles distintos según el
espacio en el que esté trabajando:

```text
María
├── GitHub Inc      → Owner
├── Startup Labs    → Admin
└── Tech Solutions  → Member
```

Sobre ese requisito se decide **en qué nivel de la jerarquía vive el rol**. La
especificación daba señales en dos direcciones que no pueden cumplirse a la vez:

1. La sección de roles dice explícitamente que el rol es una relación con el **equipo**.
2. El modelo conceptual del final de la especificación dibuja
   `User → Membership → {Organization, Role}`, es decir, el rol cuelga de la
   **organización**.

Ambos son correctos en su propio contexto, y juntos describen algo que ninguno de los dos
modelos de un solo nivel captura.

## Decisión

El rol existe en **los dos niveles**, y el del equipo tiene precedencia:

```text
rolEfectivo(usuario, equipo) = TeamMember.role ?? Membership.role
```

- `Membership.role` gobierna las acciones sobre la organización: crearla, administrarla,
  administrar sus miembros, eliminar la organización, transferir la propiedad.
- `TeamMember.role` gobierna las acciones dentro de un equipo concreto.

Ejemplo de resolución:

```text
María
├── GitHub Inc
│   ├── Membership.role   → ADMIN
│   ├── Mercadotecnia     → MEMBER   ← prevalece dentro de este equipo
│   └── Desarrollo        → no pertenece → prevalece ADMIN de la organización
│
└── Startup Labs
    └── Membership.role   → MEMBER
```

Al trabajar sobre una tarea de Mercadotecnia, María actúa como `MEMBER`. Al crear un
equipo dentro de GitHub Inc, actúa como `ADMIN`.

### Permisos por rol

| Permiso               | Owner | Admin |                  Member                  |
| --------------------- | :---: | :---: | :--------------------------------------: |
| `organization:delete` |   ✓   |       |                                          |
| `organization:update` |   ✓   |   ✓   |                                          |
| `member:invite`       |   ✓   |   ✓   |                                          |
| `member:remove`       |   ✓   |   ✓   |                                          |
| `member:update_role`  |   ✓   |   ✓   |                                          |
| `team:create`         |   ✓   |   ✓   |                                          |
| `team:delete`         |   ✓   |       |                                          |
| `task:create`         |   ✓   |   ✓   |                                          |
| `task:assign`         |   ✓   |   ✓   |                                          |
| `task:update`         |   ✓   |   ✓   |   solo las tareas que tiene asignadas    |
| `task:delete`         |   ✓   |   ✓   |                                          |
| `subtask:create`      |   ✓   |   ✓   |   solo las tareas que tiene asignadas    |
| `subtask:update`      |   ✓   |   ✓   | solo las subtareas de sus propias tareas |

El detalle importante de la última fila, y la razón de ser de `subtask:*`: la
segmentación de una tarea es responsabilidad de quien tiene la tarea asignada, incluso si
su rol es `MEMBER`. Esa es la regla que sostiene la filosofía del producto de que los
responsables definen _qué_ se hace y los empleados definen _cómo_ se ejecuta.

La tabla se implementará en un `PermissionService` con una matriz explícita por rol, de
modo que asignar un permiso nuevo sea agregar una fila y no reescribir condicionales.

## Alternativas consideradas

### Rol solo en el equipo

`TeamMember.role` es la única fuente de verdad.

- A favor: es la lectura más literal de la especificación.
- En contra: no hay forma de expresar "puede administrar la organización". El Owner de
  GitHub Inc pertenece a la organización y, según el modelo, no a ningún equipo, así que no
  tendría ningún rol y por lo tanto ningún permiso. La organización quedaría sin
  administrador. Descartada por hueco funcional.

### Rol solo en la organización

`Membership.role` es la única fuente de verdad. El equipo queda como agrupador.

- A favor: la más simple de implementar y de auditar. Una sola relación que resolver.
- En contra: contradice el requisito explícito de tener un rol distinto por equipo, y
  vuelve imposible que alguien sea `MEMBER` en un equipo y `ADMIN` en otro de la misma
  organización, que es un caso razonable y frecuente. Descartada.

### Rol en el equipo con herencia de organización

Igual que la decisión, pero con la herencia modelada como un árbol de permisos en lugar de
una resolución de rol único.

- A favor: más flexible, permite permisos que no se derivan limpiamente de un rol.
- En contra: los usuarios razonan por roles, no por permisos heredados. Mezclar ambos
  mecanismos hace que la pregunta "¿qué puede hacer esta persona?" requiera componer
  reglas de fuentes distintas. Más difícil de explicar y de testear. Descartada.

## Consecuencias

### Positivas

- Ninguna de las dos secciones de la especificación queda sin cumplir.
- El producto puede expresar el caso "admin de la empresa pero miembro del equipo" sin que
  sea una excepción ni un parche.
- La matriz de permisos por rol es legible y testeable de forma aislada, sin base de datos.

### Negativas

- Resolver el rol efectivo requiere consultar dos relaciones. En la práctica significa un
  `left join` de `Membership` y `TeamMember` sobre el `userId` autenticado, en lugar de una
  consulta a una sola tabla.
- Hay que decidir y documentar el caso "pertenece a la organización pero no al equipo". La
  regla elegida es que su rol efectivo es el de la organización, pero **el aislamiento de
  datos sigue aplicándose**: sin ser miembro del equipo no puede leer sus tareas ni sus
  subtareas. El rol no otorga acceso por sí solo. Esto es contraintuitivo y hay que
  documentarlo bien para que no se interprete al revés.
- La precedencia del rol de equipo sobre el de organización puede sorprender. Se mitiga
  exponiendo el rol efectivo y su origen en la respuesta de `/me`, para que el frontend
  pueda explicarle al usuario por qué ve lo que ve.
- Un cambio de rol en la organización no necesariamente afecta al comportamiento dentro de
  un equipo del que el usuario es miembro, porque ahí manda `TeamMember.role`. Los tests de
  autorización deben cubrir explícitamente esta interacción.
