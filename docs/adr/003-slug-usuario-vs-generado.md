# ADR 003: El slug lo elige el usuario y se valida en el servidor

- **Estado:** Aceptado
- **Fecha:** 2026-10-16
- **Ámbito:** API, modelo de datos

## Contexto

El `slug` es el identificador legible de una organización o un equipo: lo que va en la
URL en lugar del `id` (`cordel/app/acme/equipo/desarrollo` en lugar de
`cordel/app/clq8x2v9k0001...`).

Al crear una organización, el cliente manda el slug en el body y el servidor lo guarda
tal cual (normalizado). Al principio no se definieron dos cosas:

1. **Quién decide el slug**: el usuario o el servidor.
2. **Qué formato es válido**: el DTO aceptaba cualquier texto de 1 a 100 caracteres, así
   que `"Mi Org!!!"` quedaba registrado como slug y rompía las URLs.

## Decisión

**Lo elige el usuario y el servidor solo valida el formato.** No se genera automáticamente.

Formato admitido (expresado como regex):

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

- Solo minúsculas, números y guiones.
- Empieza y termina con letra o número.
- Guiones solo en medio, nunca dos seguidos.
- Normalización previa: `trim()` + minúsculas, para que `" Acme "` y `"ACME"` sean el
  mismo slug.
- Si ya existe, responde `409`. Esto lo ya venía haciendo el servicio.

Ejemplos: `acme`, `mi-empresa`, `empresa-2026`. Rechazados: `Mi Org`, `-acme-`, `a--b`.

La regla vive en `CreateOrganizationDto` (`apps/api/src/organizations/dto/`),
validada antes de que el controlador reciba nada.

## Alternativas consideradas

### Slug generado por el servidor

Se deriva del `name` con transliteración (`"Mi Empresa"` → `mi-empresa`) y se le agrega
un sufijo si hay choque (`mi-empresa-2`).

- A favor: no se puede mandar basura, sin casos ofensivos ni caracteres rotos.
- En contra: el usuario termina con identificadores que no eligió y rara vez los cambia.
  La transliteración bien hecha (acentos, `ñ`, unicode) es código no trivial. Descartada.

### Slug con transliteración del lado del usuario

El usuario escribe con acentos y el servidor los convierte (`"Empresa Ñ"` → `empresa-n`).

- A favor: más amable al escribir.
- En contra: es un paso de generación encubierto: qué hace con caracteres que no se
  transliteran limpio (`"café@#"`) deja de ser obvio. Descartada por ambigüedad; si algún
  día se necesita, se añade como normalización previa sin cambiar esta decisión.

### Sin slug, solo `id`

- A favor: cero decisiones y cero validaciones.
- En contra: URLs ilegibles y ninguna identidad pública. Descartada: el slug ya es parte
  del modelo (`Organization.slug` único global, `Team.slug` único por organización).

## Consecuencias

### Positivas

- El usuario controla algo público y visible de su organización (su identidad en la URL).
- Si el slug elegido está tomado, lo resuelve él con otro, sin sufijos automáticos.
- La validación es una sola regla, fácil de replicar en el frontend con el mismo mensaje.

### Negativas

- Hay que mantener el formato a raya: sin esta validación el servidor aceptaba cualquier
  texto. Mitigación: la regex del DTO + mensajes en español, verificados con typecheck,
  lint y tests.
- El slug es adivinable, así que es un objetivo de enumeración. Mitigación ya aplicada
  en `OrganizationsService.findBySlug`: si la organización existe pero el usuario no es
  miembro, responde `404` (igual que si no existe), para no revelar qué slugs hay.
- Casos ofensivos en slugs no los filtra nadie. Aceptado por ahora: el slug no es
  contenido generado hacia terceros, y añadir lista de palabras tendría que ser un
  mecanismo distinto.

### Pendiente

`Team.slug` tiene la misma naturaleza pero aún no tiene endpoint de creación donde
aplicar la regla. Cuando exista, reutiliza esta misma regex y este mismo ADR.
