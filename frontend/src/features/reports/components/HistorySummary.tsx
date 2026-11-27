import type { LoanHistorySummary } from '@/features/reports/types/report';
import { Card } from '@/shared/components/Card';

interface HistorySummaryProps {
  summary: LoanHistorySummary;
}

interface Stat {
  label: string;
  value: number;
}

function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 divide-x divide-slate-200 sm:grid-flow-col sm:auto-cols-fr">
      {stats.map((stat) => (
        <div key={stat.label} className="px-5 py-4">
          <dd className="text-3xl font-bold text-slate-900">{stat.value}</dd>
          <dt className="text-sm text-slate-500">{stat.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/** Totales del historial en una tira; las devoluciones van aparte: normales + dañadas + perdidas = total. */
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
    <Card className="divide-y divide-slate-200">
      <StatStrip stats={states} />
      <section aria-labelledby="returns-heading">
        <h2
          id="returns-heading"
          className="border-l-4 border-primary-700 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Devoluciones
        </h2>
        <StatStrip stats={returns} />
        <p className="border-t border-slate-200 px-5 py-2 text-xs text-slate-500">
          De las devoluciones, {summary.returnedLate} se hicieron con atraso.
        </p>
      </section>
    </Card>
  );
}
