/* * Contrato compartido entre la API y el frontend. */

/* # Marca de tiempo serializada por la API (ISO 8601). */
export type ISODateString = string;

/* # Rol dentro de una organización o de un equipo. */
/* * Nunca es una propiedad de `User`: el rol es una relación entre el usuario y
 * la organización (Membership) o el equipo (TeamMember).*/
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';

/* # Plan de la cuenta. Determina los límites y las funciones de IA. */
export type Plan = 'FREE' | 'PREMIUM';

/* # Estado de una tarea o subtarea. */
/* * `BLOCKED` representa el estado "no disponible": hay un bloqueo, pero no
 * impide el seguimiento del resto del trabajo.*/
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/* # Usuario. Identidad global de la cuenta. */
/* * No lleva rol: una misma persona puede ser OWNER en una organización
 * y MEMBER en otra. El rol vive en `Membership` y `TeamMember`. */
export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  emailVerifiedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* # Vista reducida de un usuario para incrustar en respuestas. */
/* * Evita arrastrar el objeto completo cuando solo se necesita mostrar
 * quién es quién (listas de miembros, autores de comentarios). */
export interface UserSummary {
  id: string;
  email: string;
  name: string;
}

/* # Organización. El tenant: unidad de aislamiento y facturación. */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* # Membresía. Relación usuario ↔ organización, y donde vive el rol
 * a nivel organización. */
export interface Membership {
  userId: string;
  organizationId: string;
  role: Role;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* # Membresía con su usuario resumido, lista para mostrar en UI. */
export interface MembershipWithUser extends Membership {
  user: UserSummary;
}

/* # Equipo. Grupo de trabajo dentro de exactamente una organización. */
export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* # Pertenencia a equipo. Relación usuario ↔ equipo, y donde vive el rol
 * a nivel equipo. Tiene precedencia sobre `Membership.role`. */
export interface TeamMember {
  teamId: string;
  userId: string;
  role: Role;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* # Pertenencia a equipo con su usuario resumido. */
export interface TeamMemberWithUser extends TeamMember {
  user: UserSummary;
}

/* # Tarea. Objetivo de trabajo dentro de un equipo. */
/* * Lleva `organizationId` Y `teamId` aunque parezca redundante: es lo que
 * permite el aislamiento estricto y la FK compuesta contra `Team`. */
export interface Task {
  id: string;
  organizationId: string;
  teamId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  dueDate: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* # Subtarea. Paso definido por el responsable de la tarea. */
/* * `blockedReason` + `blockedAt` se informan cuando `status` es `BLOCKED`.
 * `position` ordena los pasos dentro de la tarea. */
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: ISODateString | null;
  blockedReason: string | null;
  blockedAt: ISODateString | null;
  position: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* # Dependencia entre subtareas. `subtaskId` no puede empezar hasta que
 * `dependsOnSubtaskId` esté completa. */
export interface SubtaskDependency {
  subtaskId: string;
  dependsOnSubtaskId: string;
}

/* # Tipos de notificación del sistema. */
export type NotificationType =
  'TASK_ASSIGNED' | 'TASK_DUE_SOON' | 'SUBTASK_BLOCKED' | 'SUBTASK_UNBLOCKED' | 'MEMBER_ADDED';

/* # Comentario sobre una tarea O una subtarea, nunca ambas. */
/* * Uno de `taskId` / `subtaskId` es string y el otro null. */
export interface Comment {
  id: string;
  organizationId: string;
  teamId: string;
  taskId: string | null;
  subtaskId: string | null;
  authorId: string;
  body: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/* # Archivo adjunto a una tarea O una subtarea, nunca ambas. */
/* * `storageKey` es la referencia interna al almacenamiento; `fileName`
 * es el nombre original para mostrar. */
export interface Attachment {
  id: string;
  organizationId: string;
  teamId: string;
  taskId: string | null;
  subtaskId: string | null;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  createdAt: ISODateString;
}

/* # Notificación para un usuario. */
/* * `teamId` es null en avisos de nivel organización (p. ej. `MEMBER_ADDED`).
 * `readAt` null significa no leída. */
export interface Notification {
  id: string;
  organizationId: string;
  teamId: string | null;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId: string | null;
  subtaskId: string | null;
  readAt: ISODateString | null;
  createdAt: ISODateString;
}

/* # Acciones autorizables. Espeja la matriz de ADR 002: añadir un permiso
 * es añadir una fila aquí y en el `PermissionService`, sin condicionales. */
export type Permission =
  | 'organization:update'
  | 'organization:delete'
  | 'member:invite'
  | 'member:remove'
  | 'member:update_role'
  | 'team:create'
  | 'team:delete'
  | 'task:create'
  | 'task:assign'
  | 'task:update'
  | 'task:delete'
  | 'subtask:create'
  | 'subtask:update';

/* # Contexto con el que se evalúa una autorización: quién actúa y dónde. */
/* * `teamId` null = acción a nivel organización (p. ej. crear un equipo). */
export interface AuthorizationContext {
  userId: string;
  organizationId: string;
  teamId: string | null;
}

/* # Resultado de resolver qué puede hacer alguien en un contexto. */
/* * `effectiveRole` es `teamRole ?? organizationRole` (ADR 002). */
export interface EffectivePermissions {
  organizationRole: Role;
  teamRole: Role | null;
  effectiveRole: Role;
  permissions: Permission[];
}

/* # Límites del plan gratuito. Los valores (3 y 10) vienen de variables
 * de entorno, no van fijados aquí. */
export interface FreePlanLimits {
  maxOrganizationsPerUser: number;
  maxMembersPerOrganization: number;
}
