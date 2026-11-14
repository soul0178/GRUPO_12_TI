import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserPicker } from '@/features/loans/components/UserPicker';
import { HistoryReportView } from '@/features/reports/components/HistoryReportView';
import { ReportTabs } from '@/features/reports/components/ReportTabs';
import { useUserHistory } from '@/features/reports/hooks/useReports';
import type { HistoryFilters } from '@/features/reports/types/report';
import { Card } from '@/shared/components/Card';
import { PageHeader } from '@/shared/components/PageHeader';

const PAGE_SIZE = 10;

/** Historial de préstamos de un usuario (personal). Sin id en la ruta, primero se elige el usuario. */
export function UserHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const parsedId = id ? Number(id) : NaN;
  const userId = Number.isInteger(parsedId) ? parsedId : undefined;
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [page, setPage] = useState(0);
  const history = useUserHistory(userId, filters, page, PAGE_SIZE);

  return (
    <section>
      <PageHeader title="Reportes" description="Historial de préstamos por usuario o por ítem." />
      <ReportTabs />
      {userId === undefined ? (
        <Card className="p-4">
          <UserPicker
            selected={null}
            onSelect={(user) => user && navigate(`/reports/users/${user.id}`)}
          />
        </Card>
      ) : (
        <HistoryReportView
          query={history}
          filters={filters}
          onFiltersChange={setFilters}
          page={page}
          onPageChange={setPage}
          firstColumn="item"
          changeLink={{ to: '/reports/users', label: 'Cambiar usuario' }}
        />
      )}
    </section>
  );
}
