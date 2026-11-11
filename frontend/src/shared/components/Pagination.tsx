import { Button } from '@/shared/components/Button';

interface PaginationProps {
  /** Página actual, empezando en 0. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Pie de tabla con "Página X de Y" y botones Anterior/Siguiente. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{`Página ${page + 1} de ${totalPages}`}</span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
