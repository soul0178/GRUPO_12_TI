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
    <section>
      <PageHeader
        title="Mi perfil"
        description="Consulte sus datos y mantenga su información de contacto al día."
      />

      <SanctionNotice activeSanctions={activeSanctions.data?.content ?? []} />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-4 bg-primary-800 p-5">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center bg-accent-500 text-2xl font-bold text-primary-900"
            >
              {`${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">
                {`${user.firstName} ${user.lastName}`}
              </p>
              <p className="text-sm text-primary-100">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <h2 className="sr-only">Datos de la cuenta</h2>
          <dl className="divide-y divide-slate-200 text-sm">
            <div className="px-5 py-3">
              <dt className="text-xs text-slate-500">Correo institucional</dt>
              <dd className="mt-0.5 break-all font-semibold text-slate-900">{user.email}</dd>
            </div>
            <div className="px-5 py-3">
              <dt className="text-xs text-slate-500">Código o DNI</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{user.documentNumber}</dd>
            </div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">Datos de contacto</h2>
            <ProfileForm
              initialValues={{
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone ?? '',
              }}
              isSubmitting={updateProfile.isPending}
              errorMessage={
                updateProfile.isError ? getErrorMessage(updateProfile.error) : undefined
              }
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
              errorMessage={
                changePassword.isError ? getErrorMessage(changePassword.error) : undefined
              }
              successMessage={changePassword.isSuccess ? 'Contraseña actualizada' : undefined}
              onSubmit={(values) => changePassword.mutate(values)}
            />
          </Card>
        </div>
      </div>
    </section>
  );
}
