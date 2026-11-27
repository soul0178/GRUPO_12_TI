import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

const TAB_CLASSES = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

/** Pestañas "Mis reservas" / "Todas las reservas"; solo las ve el personal (encargado y administrador). */
export function ReservationTabs() {
  const role = useAuthStore((state) => state.user?.role);
  if (role !== 'MANAGER' && role !== 'ADMIN') {
    return null;
  }
  return (
    <nav aria-label="Tipo de listado de reservas" className="mb-4 flex gap-2">
      <NavLink to="/reservations" end className={TAB_CLASSES}>
        Mis reservas
      </NavLink>
      <NavLink to="/reservations/manage" className={TAB_CLASSES}>
        Todas las reservas
      </NavLink>
    </nav>
  );
}
