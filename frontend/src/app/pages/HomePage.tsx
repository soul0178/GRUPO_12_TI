import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ROLE_LABELS } from '@/features/users/types/user';
import { Card } from '@/shared/components/Card';
import { PageHeader } from '@/shared/components/PageHeader';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

/** Página de inicio con el saludo al usuario; los módulos siguientes agregan sus accesos aquí. */
export function HomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <section>
      <PageHeader
        title="Sistema de Préstamos EPCC"
        description="Préstamo y reserva de equipos, libros y objetos de la Escuela Profesional de Ciencia de la Computación."
      />
      <Card className="p-6">
        <p className="text-lg font-semibold text-slate-900">
          Bienvenido{user ? `, ${user.firstName}` : ''}.
        </p>
        {user && (
          <p className="mt-1 text-sm text-slate-500">
            Ha iniciado sesión como {ROLE_LABELS[user.role]}.
          </p>
        )}
        <p className="mt-4 text-sm text-slate-600">
          Puede revisar y actualizar sus datos en{' '}
          <Link to="/profile" className={TEXT_LINK_CLASSES}>
            Mi perfil
          </Link>
          .
        </p>
      </Card>
    </section>
  );
}
