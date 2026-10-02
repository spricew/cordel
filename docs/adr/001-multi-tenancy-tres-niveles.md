# ADR 001: Multi-tenancy de tres niveles

- **Estado:** Aceptado
- **Fecha:** 2026-10-01
- **Ámbito:** Modelo de datos y aislamiento

## Contexto

Cordel necesita que una misma persona pueda gestionar varios espacios de trabajo
independientes desde una única cuenta, y que dentro de cada uno haya grupos de trabajo
con personas distintas.

El caso de uso que motiva el diseño:

```text
GitHub Inc                      (organización)
├── Mercadotecnia               (equipo)
├── Desarrollo de software      (equipo)
└── Marketing                   (equipo)
```

Dos requisitos del producto entran en tensión:

1. **Una persona puede tener roles distintos en distintos espacios.** Ser `Owner` de una
   organización y `Member` de otra es el caso normal, no la excepción.
2. **Los datos no se mezclan.** Los datos de un equipo no deben ser visibles para quien no
   pertenece a ese equipo, aunque pertenezca a la misma organización.

La primera versión de la especificación mezclaba los términos "equipo" y "organización"
como sinónimos, y además se contradecía sobre dónde vive el rol: una sección decía que el
rol es una relación con el equipo, y el modelo conceptual del final lo ubicaba en la
organización. No era posible construir un esquema consistente hasta resolver esa
ambigüedad.

## Decisión

Adoptamos una jerarquía de **tres niveles explícitos**:

```text
Organization → Team → Task → Subtask
```

- **Organization** es el tenant: la unidad de aislamiento y de facturación.
- **Team** es un grupo de trabajo dentro de una organización.
- Los términos son disjuntos y se usan de forma consistente en código y documentación.

El aislamiento es **estricto por equipo**. Toda consulta sobre datos de equipo filtra por
`organizationId` **y** por `teamId`, y pertenecer al equipo es condición necesaria para
leer sus datos.

Para que el aislamiento no dependa únicamente del código de aplicación, `Task` declara una
**clave foránea compuesta** que referencia a `Team`:

```text
Task(organizationId, teamId) → Team(id, organizationId)
```

PostgreSQL rechaza por tanto cualquier tarea cuya organización no coincida con la del
equipo al que pertenece. Un error de aplicación en el scoping no puede producir datos
cruzados entre tenants: el motor de base de datos lo impide.

Todos los recursos tenant-scoped llevan `organizationId` con índice, porque es la columna
por la que se filtra prácticamente cualquier consulta.

## Alternativas consideradas

### Base de datos por tenant

Una base de datos por organización, con un esquema por tenant.

- A favor: el aislamiento es físico y trivial de garantizar.
- En contra: las migraciones hay que ejecutarlas N veces, las consultas entre tenants se
  vuelven muy difíciles, y el coste operativo por cuenta pequeña es prohibitivo. Descartada
  para un producto con plan gratuito y organizaciones de tamaño modesto.

### Esquema por tenant

Un esquema PostgreSQL por organización.

- A favor: aislamiento lógico claro, migraciones centrales.
- En contra: `search_path` manipulable desde la aplicación, lo que reintroduce la
  superficie de BOLA. Además complica el pooling de conexiones. Descartada.

### Aislamiento solo por organización

El equipo existe únicamente como agrupador visual, y todo el scoping es por
`organizationId`.

- A favor: mucho más simple. Una sola columna que filtrar, una sola relación que
  resolver.
- En contra: contradice directamente el requisito de que los datos de un equipo no sean
  visibles para los demás miembros de la organización. Descartada.

### Rol solo en el equipo, sin nivel de organización

La organización es un contenedor sin roles propios; todo el RBAC vive en `TeamMember`.

- A favor: es la lectura más literal de la especificación original.
- En contra: deja sin definir qué puede hacer alguien que pertenece a la organización pero
  a ningún equipo. No puede administrar la organización, porque no hay rol que lo permita;
  tampoco puede verla. Es un hueco funcional real. Descartada.

## Consecuencias

### Positivas

- Los tres niveles son distinguibles en el esquema, lo que hace las consultas y las
  políticas de acceso explícitas en lugar de implícitas.
- El aislamiento se apoya en el motor de base de datos, no solo en la aplicación.
- Permite que el límite del plan gratuito se aplique a organizaciones, que es la unidad que
  realmente consume recursos, en lugar de a equipos.

### Negativas

- Cada consulta necesita dos filtros en lugar de uno. Un error de scoping no produce un
  error visible de inmediato, sino datos de otro equipo dentro de la misma organización.
  Mitigación: los tests de aislamiento deben cubrir explícitamente el caso
  intra-organización entre equipos distintos, no solo el caso entre organizaciones.
- `organizationId` está desnormalizado en `Task`, `Comment` y `Attachment`. Es redundante
  con el de su equipo, pero es lo que permite el filtro sin un join y lo que habilita la FK
  compuesta. El costo es mantener la coherencia en las escrituras.
- El número de joins para resolver permisos sube respecto a un modelo de dos niveles. Ver
  [ADR 002](002-rbac-roles-en-dos-niveles.md).

### Consecuencia pendiente

`Project` aparece mencionado en la especificación original solo de pasada, dentro de la
sección de documentación asistida por IA. **No forma parte de este modelo.** Se decidirá
cuando la funcionalidad de IA se defina; agregar el nivel sería una migración no disruptiva
porque la jerarquía ya está preparada para insertarse entre `Team` y `Task`.