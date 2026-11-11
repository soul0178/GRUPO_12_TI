/** Roles del sistema; coinciden con los del backend. */
export type Role = 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE' | 'MANAGER' | 'ADMIN';

/** Datos mínimos del usuario autenticado que guarda la sesión. */
export interface SessionUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: SessionUser;
}
