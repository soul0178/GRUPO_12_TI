import type {
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateProfileRequest,
  UpdateUserRequest,
  User,
  UserSummary,
} from '@/features/users/types/user';
import { apiClient } from '@/shared/api/apiClient';
import type { Page } from '@/shared/types/api';

/** Llama a GET /users (solo ADMIN). */
export async function getUsers(page: number, size: number): Promise<Page<User>> {
  const { data } = await apiClient.get<Page<User>>('/users', { params: { page, size } });
  return data;
}

/** Llama a GET /users/{id} (solo ADMIN). */
export async function getUser(id: number): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}

/** Llama a POST /users (solo ADMIN). */
export async function createUser(request: CreateUserRequest): Promise<User> {
  const { data } = await apiClient.post<User>('/users', request);
  return data;
}

/** Llama a PUT /users/{id} (solo ADMIN). */
export async function updateUser(id: number, request: UpdateUserRequest): Promise<User> {
  const { data } = await apiClient.put<User>(`/users/${id}`, request);
  return data;
}

/** Llama a POST /users/{id}/activate o /deactivate (solo ADMIN). */
export async function setUserActive(id: number, active: boolean): Promise<User> {
  const action = active ? 'activate' : 'deactivate';
  const { data } = await apiClient.post<User>(`/users/${id}/${action}`);
  return data;
}

/** Llama a GET /me. */
export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<User>('/me');
  return data;
}

/** Llama a PUT /me. */
export async function updateProfile(request: UpdateProfileRequest): Promise<User> {
  const { data } = await apiClient.put<User>('/me', request);
  return data;
}

/** Llama a PUT /me/password. */
export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  await apiClient.put('/me/password', request);
}

/** Llama a GET /users/lookup (personal): busca por nombre, correo o código/DNI (máximo 10). */
export async function lookupUsers(text: string): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>('/users/lookup', { params: { text } });
  return data;
}
