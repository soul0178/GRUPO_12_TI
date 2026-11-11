import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '@/features/users/types/user';
import type { User } from '@/features/users/types/user';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

interface UserTableProps {
  users: User[];
  /** Id del usuario autenticado; no puede desactivarse a sí mismo. */
  currentUserId?: number;
  isUpdating: boolean;
  onToggleActive: (user: User) => void;
}

const HEADER_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

/** Tabla de usuarios con acciones de editar y activar/desactivar. */
export function UserTable({ users, currentUserId, isUpdating, onToggleActive }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className={HEADER_CLASSES}>Nombre</th>
            <th className={HEADER_CLASSES}>Correo</th>
            <th className={HEADER_CLASSES}>Código / DNI</th>
            <th className={HEADER_CLASSES}>Rol</th>
            <th className={HEADER_CLASSES}>Estado</th>
            <th className={`${HEADER_CLASSES} text-right`}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{`${user.firstName} ${user.lastName}`}</td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3 text-slate-600">{user.documentNumber}</td>
              <td className="px-4 py-3">
                <Badge tone="indigo">{ROLE_LABELS[user.role]}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge tone={user.active ? 'green' : 'slate'}>
                  {user.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  <Link to={`/users/${user.id}/edit`} className={TEXT_LINK_CLASSES}>
                    Editar
                  </Link>
                  {user.id !== currentUserId && (
                    <Button
                      variant={user.active ? 'danger' : 'secondary'}
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => onToggleActive(user)}
                    >
                      {user.active ? 'Desactivar' : 'Activar'}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
