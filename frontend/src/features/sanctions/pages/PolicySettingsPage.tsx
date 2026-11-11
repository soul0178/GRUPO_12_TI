import { PolicySettingsForm } from '@/features/sanctions/components/PolicySettingsForm';
import {
  usePolicySettings,
  useUpdatePolicySettings,
} from '@/features/sanctions/hooks/usePolicySettings';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';

/** Pantalla donde el ADMIN edita los parámetros de política: límite de ítems y expiración de reservas (RF-08). */
export function PolicySettingsPage() {
  const settings = usePolicySettings();
  const update = useUpdatePolicySettings();

  return (
    <section className="mx-auto max-w-3xl">
      <PageHeader
        title="Políticas"
        description="Parámetros generales de préstamos y reservas. Los plazos por categoría se editan en Categorías."
      />
      {settings.isLoading && <LoadingState message="Cargando políticas..." />}
      {settings.isError && <Alert variant="error">{getErrorMessage(settings.error)}</Alert>}
      {settings.data && (
        <Card className="p-6">
          <PolicySettingsForm
            initialValues={settings.data}
            isSubmitting={update.isPending}
            errorMessage={update.isError ? getErrorMessage(update.error) : undefined}
            successMessage={update.isSuccess ? 'Políticas actualizadas' : undefined}
            onSubmit={(values) => update.mutate(values)}
          />
        </Card>
      )}
    </section>
  );
}
