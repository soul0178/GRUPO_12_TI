import type { Role } from '@/features/auth/types/auth';

/** Usuario tal como lo devuelve el backend (UserResponse). */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  phone: string | null;
  role: Role;
  active: boolean;
  createdAt: string;
}

/** Datos mínimos de un usuario para elegirlo en una búsqueda (UserSummaryResponse). */
export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  role: Role;
  active: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  phone?: string;
  password: string;
  role: Role;
}

export type UpdateUserRequest = Omit<CreateUserRequest, 'password'>;

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Nombre de cada rol para mostrar en pantalla. */
export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Estudiante',
  TEACHER: 'Docente',
  ADMINISTRATIVE: 'Administrativo',
  MANAGER: 'Encargado',
  ADMIN: 'Administrador',
};

export const ROLES = Object.keys(ROLE_LABELS) as Role[];
