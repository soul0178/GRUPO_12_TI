import type { LoginRequest, LoginResponse } from '@/features/auth/types/auth';
import { apiClient } from '@/shared/api/apiClient';

/** Llama a POST /auth/login. */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', request);
  return data;
}
