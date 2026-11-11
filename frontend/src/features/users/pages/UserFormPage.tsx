import { useNavigate, useParams } from 'react-router-dom';
import { UserForm } from '@/features/users/components/UserForm';
import type { UserFormValues } from '@/features/users/components/UserForm';
import { useCreateUser, useUpdateUser } from '@/features/users/hooks/useUserMutations';
import { useUser } from '@/features/users/hooks/useUsers';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';

/** Pantalla de alta (`/users/new`) y edición (`/users/:id/edit`) de un usuario (solo ADMIN, RF-01). */
export function UserFormPage() {
  const { id } = useParams();
  const userId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const existing = useUser(userId);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(userId ?? 0);
  const mutation = userId === undefined ? createUser : updateUser;

  if (userId !== undefined && existing.isLoading) {
    return <LoadingState message="Cargando usuario..." />;
  }
  if (userId !== undefined && (existing.isError || !existing.data)) {
    return <Alert variant="error">{getErrorMessage(existing.error)}</Alert>;
  }

  function handleSubmit(values: UserFormValues) {
    const request = { ...values, phone: values.phone || undefined };
    const options = { onSuccess: () => navigate('/users') };
    if (userId === undefined) {
      createUser.mutate({ ...request, password: values.password ?? '' }, options);
    } else {
      updateUser.mutate({ ...request }, options);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <PageHeader
        title={userId === undefined ? 'Nuevo usuario' : 'Editar usuario'}
        description="Los datos del usuario y su rol en el sistema."
      />
      <Card className="p-6">
        <UserForm
          mode={userId === undefined ? 'create' : 'edit'}
          initialValues={existing.data && { ...existing.data, phone: existing.data.phone ?? '' }}
          isSubmitting={mutation.isPending}
          errorMessage={mutation.isError ? getErrorMessage(mutation.error) : undefined}
          onSubmit={handleSubmit}
        />
      </Card>
    </section>
  );
}
