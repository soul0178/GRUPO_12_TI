import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { UserTable } from '@/features/users/components/UserTable';
import { useSetUserActive } from '@/features/users/hooks/useUserMutations';
import { useUsers } from '@/features/users/hooks/useUsers';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { PRIMARY_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

const PAGE_SIZE = 10;

/** Listado paginado de usuarios con acceso a crear, editar y activar/desactivar (solo ADMIN, RF-01). */
export function UserListPage() {
  const [page, setPage] = useState(0);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, 300);
  const users = useUsers(page, PAGE_SIZE, debounced);
  const setActive = useSetUserActive();

  return (
    <section>
      <PageHeader
        title="Usuarios"
        description="Cree, edite y active o desactive las cuentas del sistema."
        actions={
          <Link to="/users/new" className={PRIMARY_LINK_CLASSES}>
            Nuevo usuario
          </Link>
        }
      />

      <div className="space-y-4">
        <div>
          <label htmlFor="user-filter" className="mb-1 block text-sm font-medium text-slate-700">
            Buscar usuario
          </label>
          <input
            id="user-filter"
            type="search"
            placeholder="Nombre, correo o código/DNI"
            className={`${INPUT_CLASSES} max-w-md`}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setPage(0);
            }}
          />
        </div>
        {users.isError && <Alert variant="error">{getErrorMessage(users.error)}</Alert>}
        {setActive.isError && <Alert variant="error">{getErrorMessage(setActive.error)}</Alert>}
        {users.isLoading && <LoadingState message="Cargando usuarios..." />}
        {users.data && users.data.content.length === 0 && (
          <EmptyState
            message={
              debounced.trim() ? 'No se encontraron usuarios.' : 'No hay usuarios registrados.'
            }
          />
        )}
        {users.data && users.data.content.length > 0 && (
          <Card className="overflow-hidden">
            <UserTable
              users={users.data.content}
              currentUserId={currentUserId}
              isUpdating={setActive.isPending}
              onToggleActive={(user) => setActive.mutate({ id: user.id, active: !user.active })}
            />
            <Pagination page={page} totalPages={users.data.totalPages} onPageChange={setPage} />
          </Card>
        )}
      </div>
    </section>
  );
}
