import { Link } from 'react-router-dom';
import { CONDITION_LABELS, LOAN_STATUS_LABELS } from '@/features/loans/types/loan';
import type { Loan, LoanStatus } from '@/features/loans/types/loan';
import { Badge } from '@/shared/components/Badge';
import { TEXT_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface LoanTableProps {
  loans: Loan[];
}

const HEADER_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

const STATUS_TONES: Record<LoanStatus, 'green' | 'red' | 'slate'> = {
  ACTIVE: 'green',
  OVERDUE: 'red',
  RETURNED: 'slate',
};

/** Tabla de préstamos con su estado y el enlace para registrar la devolución. */
export function LoanTable({ loans }: LoanTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className={HEADER_CLASSES}>Ítem</th>
            <th className={HEADER_CLASSES}>Usuario</th>
            <th className={HEADER_CLASSES}>Salida</th>
            <th className={HEADER_CLASSES}>Vence</th>
            <th className={HEADER_CLASSES}>Estado</th>
            <th className={`${HEADER_CLASSES} text-right`}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {loans.map((loan) => (
            <tr key={loan.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{loan.itemCode}</p>
                <p className="text-xs text-slate-500">
                  {loan.itemName} · {CONDITION_LABELS[loan.deliveryCondition]}
                </p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{loan.userFullName}</p>
                <p className="text-xs text-slate-500">{loan.userEmail}</p>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {formatDateTime(loan.checkedOutAt)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(loan.dueAt)}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONES[loan.status]}>{LOAN_STATUS_LABELS[loan.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {loan.status !== 'RETURNED' && (
                  <Link
                    to={`/loans/${loan.id}/return`}
                    aria-label={`Registrar devolución de ${loan.itemCode}`}
                    className={TEXT_LINK_CLASSES}
                  >
                    Devolver
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
