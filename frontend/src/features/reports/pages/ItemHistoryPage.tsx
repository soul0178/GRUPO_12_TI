import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ItemPicker } from '@/features/loans/components/ItemPicker';
import { HistoryReportView } from '@/features/reports/components/HistoryReportView';
import { ReportTabs } from '@/features/reports/components/ReportTabs';
import { useItemHistory } from '@/features/reports/hooks/useReports';
import type { HistoryFilters } from '@/features/reports/types/report';
import { Card } from '@/shared/components/Card';
import { PageHeader } from '@/shared/components/PageHeader';

const PAGE_SIZE = 10;

/** Historial de préstamos de un ítem (personal). Sin id en la ruta, primero se elige el ítem. */
export function ItemHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const parsedId = id ? Number(id) : NaN;
  const itemId = Number.isInteger(parsedId) ? parsedId : undefined;
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [page, setPage] = useState(0);
  const history = useItemHistory(itemId, filters, page, PAGE_SIZE);

  return (
    <section>
      <PageHeader title="Reportes" description="Historial de préstamos por usuario o por ítem." />
      <ReportTabs />
      {itemId === undefined ? (
        <Card className="p-4">
          <ItemPicker
            selected={null}
            availableOnly={false}
            onSelect={(item) => item && navigate(`/reports/items/${item.id}`)}
          />
        </Card>
      ) : (
        <HistoryReportView
          query={history}
          filters={filters}
          onFiltersChange={setFilters}
          page={page}
          onPageChange={setPage}
          firstColumn="user"
          changeLink={{ to: '/reports/items', label: 'Cambiar ítem' }}
        />
      )}
    </section>
  );
}
