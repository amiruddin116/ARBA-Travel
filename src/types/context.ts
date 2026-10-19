// Shared types for the ARBA Context OS.

export type UserRole = 'master' | 'manager' | 'builder' | 'viewer';
export type ContextSensitivity = 'shared' | 'restricted';
export type ContextStatus = 'draft' | 'published' | 'stale' | 'archived';

export interface Department {
  id: string;
  name: string;
  slug: string;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  departmentId: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface ContextItem {
  id: string;
  title: string;
  body: string;
  summary: string | null;
  source: string;
  sourceRef: string | null;
  ownerDepartmentId: string;
  sensitivity: ContextSensitivity;
  status: ContextStatus;
  tags: string[];
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatchedContext {
  contextItemId: string;
  chunkId: string;
  title: string;
  content: string;
  ownerDepartmentId: string;
  similarity: number;
}
