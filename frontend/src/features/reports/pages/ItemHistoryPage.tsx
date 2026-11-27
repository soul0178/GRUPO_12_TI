import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ITEM_STATUS_LABELS } from '@/features/inventory/types/inventory';
import type { ItemStatus } from '@/features/inventory/types/inventory';
import { ItemPicker } from '@/features/loans/components/ItemPicker';
import { HistoryReportView } from '@/features/reports/components/HistoryReportView';
import { ReportTabs } from '@/features/reports/components/ReportTabs';
import { useItemHistory } from '@/features/reports/hooks/useReports';
import type { HistoryFilters } from '@/features/reports/types/report';
import { Card } from '@/shared/components/Card';
import { INPUT_CLASSES } from '@/shared/components/FormField';
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
  const [itemStatus, setItemStatus] = useState<ItemStatus | ''>('');
  const history = useItemHistory(itemId, filters, page, PAGE_SIZE);

  return (
    <section>
      <PageHeader title="Reportes" description="Historial de préstamos por usuario o por ítem." />
      <ReportTabs />
      {itemId === undefined ? (
        <Card className="space-y-4 p-4">
          <div>
            <label htmlFor="item-state" className="mb-1.5 block text-sm font-medium text-slate-700">
              Estado del ítem
            </label>
            <select
              id="item-state"
              className={`${INPUT_CLASSES} sm:max-w-xs`}
              value={itemStatus}
              onChange={(event) => setItemStatus(event.target.value as ItemStatus | '')}
            >
              <option value="">Todos</option>
              <option value="OUT_OF_SERVICE">Dañados (fuera de servicio)</option>
              <option value="RETIRED">Perdidos o dados de baja</option>
              <option value="ON_LOAN">{ITEM_STATUS_LABELS.ON_LOAN}</option>
              <option value="AVAILABLE">{ITEM_STATUS_LABELS.AVAILABLE}</option>
            </select>
          </div>
          <ItemPicker
            selected={null}
            availableOnly={false}
            status={itemStatus || undefined}
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
