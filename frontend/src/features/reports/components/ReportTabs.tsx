import { NavLink } from 'react-router-dom';

const TAB_CLASSES = ({ isActive }: { isActive: boolean }) =>
  ` px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

/** Alterna entre el historial por usuario y el historial por ítem. */
export function ReportTabs() {
  return (
    <nav aria-label="Tipo de reporte" className="mb-4 flex gap-2">
      <NavLink to="/reports/users" className={TAB_CLASSES}>
        Por usuario
      </NavLink>
      <NavLink to="/reports/items" className={TAB_CLASSES}>
        Por ítem
      </NavLink>
    </nav>
  );
}
