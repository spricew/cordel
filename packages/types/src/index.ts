export type Role = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Membership {
  userId: string;
  organizationId: string;
  role: Role;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assigneeId?: string;
}