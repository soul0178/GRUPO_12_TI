import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { Role } from '@/features/auth/types/auth';
import { ROLE_LABELS } from '@/features/users/types/user';
import { Button } from '@/shared/components/Button';

interface NavItem {
  label: string;
  to: string;
  /** Si se omite, el enlace lo ve cualquier usuario con sesión. */
  roles?: Role[];
}

/** Enlaces de la barra de navegación; cada módulo agrega los suyos aquí. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/items' },
  { label: 'Reservas', to: '/reservations' },
  { label: 'Mi perfil', to: '/profile' },
  { label: 'Préstamos', to: '/loans', roles: ['MANAGER', 'ADMIN'] },
  { label: 'Sanciones', to: '/sanctions', roles: ['MANAGER', 'ADMIN'] },
  { label: 'Categorías', to: '/categories', roles: ['ADMIN'] },
  { label: 'Políticas', to: '/settings', roles: ['ADMIN'] },
  { label: 'Usuarios', to: '/users', roles: ['ADMIN'] },
];

/** Layout principal: barra de navegación según el rol, datos de la sesión y el contenido de la ruta. */
export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              EP
            </span>
            <span className="text-base font-semibold text-slate-900">Préstamos EPCC</span>
          </div>

          <nav aria-label="Navegación principal" className="flex flex-1 items-center gap-1">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `rounded-lg px-2 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
            >
              {initials}
            </span>
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user ? `${user.firstName} ${user.lastName}` : ''}
              </p>
              <p className="text-xs text-slate-500">{user ? ROLE_LABELS[user.role] : ''}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
