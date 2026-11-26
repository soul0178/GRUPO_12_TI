import type { LoanHistorySummary } from '@/features/reports/types/report';
import { Card } from '@/shared/components/Card';

interface HistorySummaryProps {
  summary: LoanHistorySummary;
}

interface Stat {
  label: string;
  value: number;
}

function StatGrid({ stats, className }: { stats: Stat[]; className: string }) {
  return (
    <dl className={className}>
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

/** Totales del historial; las devoluciones van en su sección: normales + dañadas + perdidas = total. */
export function HistorySummary({ summary }: HistorySummaryProps) {
  const states: Stat[] = [
    { label: 'Total', value: summary.total },
    { label: 'Activos', value: summary.active },
    { label: 'Vencidos', value: summary.overdue },
  ];
  const returns: Stat[] = [
    { label: 'Total devoluciones', value: summary.returned },
    { label: 'Devoluciones normales', value: summary.returnedNormal },
    { label: 'Devoluciones dañadas', value: summary.returnedDamaged },
    { label: 'Devoluciones perdidas', value: summary.returnedLost },
  ];
  return (
    <div className="space-y-4">
      <StatGrid stats={states} className="grid grid-cols-2 gap-3 sm:grid-cols-3" />
      <section aria-labelledby="returns-heading" className="space-y-2">
        <h2 id="returns-heading" className="text-sm font-semibold text-slate-700">
          Devoluciones
        </h2>
        <StatGrid stats={returns} className="grid grid-cols-2 gap-3 lg:grid-cols-4" />
        <p className="text-xs text-slate-500">
          De las devoluciones, {summary.returnedLate} se hicieron con atraso.
        </p>
      </section>
    </div>
  );
}
