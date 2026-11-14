import { CONDITION_LABELS, LOAN_STATUS_LABELS } from '@/features/loans/types/loan';
import type { Loan, LoanStatus } from '@/features/loans/types/loan';
import { Badge } from '@/shared/components/Badge';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface HistoryTableProps {
  loans: Loan[];
  /** Qué se muestra en la primera columna: el ítem (historial de un usuario) o el usuario (historial de un ítem). */
  firstColumn: 'item' | 'user';
}

const HEADER_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

const STATUS_TONES: Record<LoanStatus, 'green' | 'red' | 'slate'> = {
  ACTIVE: 'green',
  OVERDUE: 'red',
  RETURNED: 'slate',
};

/** Indica si el préstamo se devolvió después de su fecha límite. */
function wasReturnedLate(loan: Loan): boolean {
  return loan.returnedAt !== null && new Date(loan.returnedAt) > new Date(loan.dueAt);
}

/** Tabla de solo lectura de un historial de préstamos. */
export function HistoryTable({ loans, firstColumn }: HistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className={HEADER_CLASSES}>{firstColumn === 'item' ? 'Ítem' : 'Usuario'}</th>
            <th className={HEADER_CLASSES}>Salida</th>
            <th className={HEADER_CLASSES}>Vence</th>
            <th className={HEADER_CLASSES}>Devolución</th>
            <th className={HEADER_CLASSES}>Estado físico</th>
            <th className={HEADER_CLASSES}>Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {loans.map((loan) => (
            <tr key={loan.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3">
                {firstColumn === 'item' ? (
                  <>
                    <p className="font-medium text-slate-900">{loan.itemCode}</p>
                    <p className="text-xs text-slate-500">
                      {loan.itemName} · {loan.categoryName}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-slate-900">{loan.userFullName}</p>
                    <p className="text-xs text-slate-500">{loan.userEmail}</p>
                  </>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {formatDateTime(loan.checkedOutAt)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(loan.dueAt)}</td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {loan.returnedAt ? (
                  <>
                    <p>{formatDateTime(loan.returnedAt)}</p>
                    {wasReturnedLate(loan) && <Badge tone="amber">Con atraso</Badge>}
                  </>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {CONDITION_LABELS[loan.deliveryCondition]}
                {loan.returnCondition && <> → {CONDITION_LABELS[loan.returnCondition]}</>}
              </td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONES[loan.status]}>{LOAN_STATUS_LABELS[loan.status]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
