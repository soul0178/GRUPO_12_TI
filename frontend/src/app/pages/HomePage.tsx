import { Link } from 'react-router-dom';
import { Card } from '@/shared/components/Card';
import { PageHeader } from '@/shared/components/PageHeader';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';

/** Página de inicio donde solo se muestra el acceso a Mi perfil. */
export function HomePage() {
  return (
    <section>
      <PageHeader
        title="Sistema de Préstamos EPCC"
        description="Préstamo y reserva de equipos, libros y objetos de la Escuela Profesional de Ciencia de la Computación."
      />
      <Card className="p-6">
        <Link to="/profile" className={TEXT_LINK_CLASSES}>
          Mi perfil
        </Link>
      </Card>
    </section>
  );
}
