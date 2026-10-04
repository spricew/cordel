/* * Contrato compartido entre la API y el frontend. */


/* # Marca de tiempo serializada por la API (ISO 8601). */
export type ISODateString = string;


/* # Rol dentro de una organización o de un equipo. */
/* * Nunca es una propiedad de `User`: el rol es una relación entre el usuario y
* la organización (Membership) o el equipo (TeamMember).*/

export type Role = "OWNER" | "ADMIN" | "MEMBER";


/* # Plan de la cuenta. Determina los límites y las funciones de IA. */
export type Plan = "FREE" | "PREMIUM";


/* # Estado de una tarea o subtarea. */
/* * `BLOCKED` representa el estado "no disponible": hay un bloqueo, pero no
 * impide el seguimiento del resto del trabajo.*/
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";