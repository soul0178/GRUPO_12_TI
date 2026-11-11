import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/Card';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

/** Página que se muestra cuando el usuario no tiene el rol necesario para una ruta (o el backend responde 403). */
export function ForbiddenPage() {
  return (
    <Card className="mx-auto mt-10 max-w-lg p-10 text-center">
      <p className="text-sm font-semibold text-indigo-600">403</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Sin permiso</h1>
      <p className="mt-2 text-sm text-slate-500">No tiene permiso para acceder a esta página.</p>
      <Link to="/" className={`${TEXT_LINK_CLASSES} mt-6 inline-block text-sm`}>
        Volver al inicio
      </Link>
    </Card>
  );
}
