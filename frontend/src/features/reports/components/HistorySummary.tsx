import type { LoanHistorySummary } from '@/features/reports/types/report';
import { Card } from '@/shared/components/Card';

interface HistorySummaryProps {
  summary: LoanHistorySummary;
}

/** Tarjetas con los totales del historial; los dos últimos son parte de los devueltos. */
export function HistorySummary({ summary }: HistorySummaryProps) {
  const stats = [
    { label: 'Total', value: summary.total },
    { label: 'Activos', value: summary.active },
    { label: 'Vencidos', value: summary.overdue },
    { label: 'Devueltos', value: summary.returned },
    { label: 'Devueltos con atraso', value: summary.returnedLate },
    { label: 'Devueltos dañados', value: summary.returnedDamaged },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {stat.label}
          </dt>
          <dd className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</dd>
        </Card>
      ))}
    </dl>
  );
}
