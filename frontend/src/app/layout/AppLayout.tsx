import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo-epcc.png';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { Role } from '@/features/auth/types/auth';
import { ROLE_LABELS } from '@/features/users/types/user';
import { Button } from '@/shared/components/Button';

interface NavItem {
  label: string;
  to: string;
  /** Si se omite, el enlace lo ve cualquier usuario con sesión. */
  roles?: Role[];
  /** Si es false, el enlace queda activo también en sus subrutas. Por defecto solo en la ruta exacta. */
  end?: boolean;
}

/** Enlaces de la barra de navegación; cada módulo agrega los suyos aquí. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Mi perfil', to: '/profile' },
  { label: 'Catálogo', to: '/items' },
  { label: 'Reservas', to: '/reservations' },
  { label: 'Préstamos', to: '/loans', roles: ['MANAGER', 'ADMIN'] },
  { label: 'Sanciones', to: '/sanctions', roles: ['MANAGER', 'ADMIN'] },
  { label: 'Reportes', to: '/reports', roles: ['MANAGER', 'ADMIN'], end: false },
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
      <header className="sticky top-0 z-10 border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-x-6 gap-y-2 px-6">
          <div className="flex items-center gap-3 py-2">
            <img src={logo} alt="Logotipo de la EPCC" className="h-11 w-auto" />
            <span className="text-lg font-bold text-primary-800">Préstamos EPCC</span>
          </div>

          <nav aria-label="Navegación principal" className="flex flex-1 flex-wrap items-stretch">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? true}
                className={({ isActive }) =>
                  `flex items-center border-b-4 px-3 pt-1 text-sm font-semibold transition ${
                    isActive
                      ? 'border-accent-500 text-primary-800'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 py-2">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center bg-primary-800 text-xs font-bold text-white"
            >
              {initials}
            </span>
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold text-slate-900">
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
