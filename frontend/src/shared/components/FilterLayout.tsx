import type { ReactNode } from 'react';
import { Card } from '@/shared/components/Card';

interface FilterLayoutProps {
  /** Controles de búsqueda y filtros; se muestran en una columna a la izquierda. */
  filters: ReactNode;
  children: ReactNode;
}

/** Listados con los filtros en una columna lateral y los resultados a su derecha. */
export function FilterLayout({ filters, children }: FilterLayoutProps) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside aria-label="Filtros">
        <Card className="space-y-4 p-4 lg:sticky lg:top-24">{filters}</Card>
      </aside>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  );
}
