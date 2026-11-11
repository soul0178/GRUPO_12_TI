import { SanctionNotice } from '@/features/sanctions/components/SanctionNotice';
import { useMySanctions } from '@/features/sanctions/hooks/useSanctions';
import { ChangePasswordForm } from '@/features/users/components/ChangePasswordForm';
import { ProfileForm } from '@/features/users/components/ProfileForm';
import { useChangePassword, useProfile, useUpdateProfile } from '@/features/users/hooks/useProfile';
import { ROLE_LABELS } from '@/features/users/types/user';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';

/** Perfil del usuario: datos fijos, edición de contacto y cambio de contraseña (RF-02). */
export function ProfilePage() {
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const activeSanctions = useMySanctions('ACTIVE');

  if (profile.isLoading) {
    return <LoadingState message="Cargando perfil..." />;
  }
  if (profile.isError || !profile.data) {
    return <Alert variant="error">{getErrorMessage(profile.error)}</Alert>;
  }
  const user = profile.data;

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Mi perfil"
        description="Consulte sus datos y mantenga su información de contacto al día."
      />

      <SanctionNotice activeSanctions={activeSanctions.data?.content ?? []} />

      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900">Datos de la cuenta</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Correo institucional
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Código o DNI
            </dt>
            <dd className="mt-1 text-sm text-slate-900">{user.documentNumber}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Rol</dt>
            <dd className="mt-1 text-sm text-slate-900">{ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Datos de contacto</h2>
        <ProfileForm
          initialValues={{
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone ?? '',
          }}
          isSubmitting={updateProfile.isPending}
          errorMessage={updateProfile.isError ? getErrorMessage(updateProfile.error) : undefined}
          successMessage={updateProfile.isSuccess ? 'Perfil actualizado' : undefined}
          onSubmit={(values) =>
            updateProfile.mutate({ ...values, phone: values.phone || undefined })
          }
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Cambiar contraseña</h2>
        <ChangePasswordForm
          isSubmitting={changePassword.isPending}
          errorMessage={changePassword.isError ? getErrorMessage(changePassword.error) : undefined}
          successMessage={changePassword.isSuccess ? 'Contraseña actualizada' : undefined}
          onSubmit={(values) => changePassword.mutate(values)}
        />
      </Card>
    </section>
  );
}
