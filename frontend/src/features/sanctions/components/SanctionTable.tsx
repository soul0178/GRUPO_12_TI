import { SuggestedActions } from '@/features/sanctions/components/SuggestedActions';
import { SANCTION_STATUS_LABELS, SANCTION_TYPE_LABELS } from '@/features/sanctions/types/sanction';
import type { Sanction, SanctionStatus } from '@/features/sanctions/types/sanction';
import { Badge } from '@/shared/components/Badge';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface SanctionTableProps {
  sanctions: Sanction[];
  /** Si es true (ADMIN) las sanciones sugeridas muestran los controles para confirmar o rechazar. */
  canResolve: boolean;
  isUpdating: boolean;
  onConfirm: (id: number, days: number) => void;
  onReject: (id: number) => void;
}

const HEADER_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

const STATUS_TONES: Record<SanctionStatus, 'amber' | 'red' | 'slate' | 'indigo'> = {
  SUGGESTED: 'amber',
  ACTIVE: 'red',
  FINISHED: 'slate',
  REJECTED: 'slate',
};

/** Tabla de sanciones; el ADMIN resuelve las sugeridas desde la misma fila. */
export function SanctionTable({
  sanctions,
  canResolve,
  isUpdating,
  onConfirm,
  onReject,
}: SanctionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className={HEADER_CLASSES}>Usuario</th>
            <th className={HEADER_CLASSES}>Tipo</th>
            <th className={HEADER_CLASSES}>Motivo</th>
            <th className={HEADER_CLASSES}>Vigencia</th>
            <th className={HEADER_CLASSES}>Estado</th>
            {canResolve && <th className={`${HEADER_CLASSES} text-right`}>Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-sm">
          {sanctions.map((sanction) => (
            <tr key={sanction.id} className="align-top hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{sanction.userFullName}</p>
                <p className="text-xs text-slate-500">{sanction.userEmail}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{SANCTION_TYPE_LABELS[sanction.type]}</td>
              <td className="px-4 py-3 text-slate-600">{sanction.reason}</td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {sanction.startAt && sanction.endAt
                  ? `${formatDateTime(sanction.startAt)} – ${formatDateTime(sanction.endAt)}`
                  : 'Sin definir'}
              </td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONES[sanction.status]}>
                  {SANCTION_STATUS_LABELS[sanction.status]}
                </Badge>
              </td>
              {canResolve && (
                <td className="px-4 py-3">
                  {sanction.status === 'SUGGESTED' && (
                    <SuggestedActions
                      userName={sanction.userFullName}
                      disabled={isUpdating}
                      onConfirm={(days) => onConfirm(sanction.id, days)}
                      onReject={() => onReject(sanction.id)}
                    />
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
