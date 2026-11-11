import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPolicySettings, updatePolicySettings } from '@/features/sanctions/api/sanctionsApi';

/** Consulta los parámetros de política vigentes. */
export function usePolicySettings() {
  return useQuery({ queryKey: ['policy-settings'], queryFn: getPolicySettings });
}

/** Guarda los parámetros de política (ADMIN) y refresca la consulta. */
export function useUpdatePolicySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePolicySettings,
    onSuccess: (settings) => queryClient.setQueryData(['policy-settings'], settings),
  });
}
