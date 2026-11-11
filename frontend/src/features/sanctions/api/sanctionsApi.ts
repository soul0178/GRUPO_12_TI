import type { PolicySettings, Sanction, SanctionStatus } from '@/features/sanctions/types/sanction';
import { apiClient } from '@/shared/api/apiClient';
import type { Page } from '@/shared/types/api';

/** Llama a GET /sanctions (personal), con filtro opcional de estado. */
export async function getSanctions(
  status: SanctionStatus | undefined,
  page: number,
  size: number,
): Promise<Page<Sanction>> {
  const { data } = await apiClient.get<Page<Sanction>>('/sanctions', {
    params: { status, page, size },
  });
  return data;
}

/** Llama a GET /me/sanctions, con filtro opcional de estado. */
export async function getMySanctions(status?: SanctionStatus): Promise<Page<Sanction>> {
  const { data } = await apiClient.get<Page<Sanction>>('/me/sanctions', { params: { status } });
  return data;
}

/** Llama a POST /sanctions/{id}/confirm (solo ADMIN). */
export async function confirmSanction(id: number, days: number): Promise<Sanction> {
  const { data } = await apiClient.post<Sanction>(`/sanctions/${id}/confirm`, { days });
  return data;
}

/** Llama a POST /sanctions/{id}/reject (solo ADMIN). */
export async function rejectSanction(id: number): Promise<Sanction> {
  const { data } = await apiClient.post<Sanction>(`/sanctions/${id}/reject`);
  return data;
}

/** Llama a GET /settings. */
export async function getPolicySettings(): Promise<PolicySettings> {
  const { data } = await apiClient.get<PolicySettings>('/settings');
  return data;
}

/** Llama a PUT /settings (solo ADMIN). */
export async function updatePolicySettings(request: PolicySettings): Promise<PolicySettings> {
  const { data } = await apiClient.put<PolicySettings>('/settings', request);
  return data;
}
