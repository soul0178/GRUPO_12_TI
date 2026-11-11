import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/Card';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

/** Página para rutas que no existen. */
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="max-w-lg p-10 text-center">
        <p className="text-sm font-semibold text-indigo-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Página no encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">La página que busca no existe.</p>
        <Link to="/" className={`${TEXT_LINK_CLASSES} mt-6 inline-block text-sm`}>
          Volver al inicio
        </Link>
      </Card>
    </div>
  );
}
