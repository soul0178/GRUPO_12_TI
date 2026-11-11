import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReturnForm } from '@/features/loans/components/ReturnForm';
import type { ReturnFormValues } from '@/features/loans/components/ReturnForm';
import { useReturnLoan } from '@/features/loans/hooks/useLoanMutations';
import { useLoan } from '@/features/loans/hooks/useLoans';
import { CONDITION_LABELS, isWorseCondition } from '@/features/loans/types/loan';
import type { Loan } from '@/features/loans/types/loan';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Card } from '@/shared/components/Card';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PRIMARY_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';
import { formatDateTime } from '@/shared/utils/dateFormat';

interface ReturnEffectsProps {
  loan: Loan;
  wasOverdue: boolean;
}

/** Efectos de la devolución que el encargado debe conocer: atraso, posible daño y garantía. */
function ReturnEffects({ loan, wasOverdue }: ReturnEffectsProps) {
  const worse =
    loan.returnCondition !== null && isWorseCondition(loan.deliveryCondition, loan.returnCondition);
  return (
    <div className="space-y-3">
      <Alert variant="success">
        {`Devolución registrada: ${loan.itemCode} de ${loan.userFullName}.`}
      </Alert>
      {wasOverdue && (
        <Alert variant="error">
          El préstamo estaba vencido: se aplicó una sanción por atraso al usuario.
        </Alert>
      )}
      {worse && (
        <Alert variant="error">
          El estado empeoró: se sugirió una sanción por posible daño, pendiente de confirmación del
          administrador.
        </Alert>
      )}
      {loan.returnCondition === 'DAMAGED' && (
        <Alert variant="error">El ítem quedó fuera de servicio por volver dañado.</Alert>
      )}
      {loan.guarantee && (
        <Alert variant="success">
          {`Devuelva al usuario su garantía: ${loan.guarantee.description}.`}
        </Alert>
      )}
    </div>
  );
}

/** Pantalla donde el encargado registra la devolución de un préstamo (RF-04, RF-07). */
export function ReturnLoanPage() {
  const { id } = useParams();
  const loanId = Number(id);
  const loan = useLoan(loanId);
  const returnLoan = useReturnLoan(loanId);
  // Se guarda al enviar: al refrescar la consulta el préstamo ya figura como devuelto.
  const [wasOverdue, setWasOverdue] = useState(false);

  if (loan.isLoading) {
    return <LoadingState message="Cargando préstamo..." />;
  }
  if (loan.isError || !loan.data) {
    return <Alert variant="error">{getErrorMessage(loan.error)}</Alert>;
  }
  const current = loan.data;
  const result = returnLoan.data;

  function handleSubmit(values: ReturnFormValues) {
    setWasOverdue(current.status === 'OVERDUE');
    returnLoan.mutate({
      returnCondition: values.returnCondition,
      returnObservations: values.returnObservations?.trim() || undefined,
    });
  }

  return (
    <section>
      <PageHeader title="Registrar devolución" />
      <Card className="max-w-3xl space-y-6 p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Ítem</dt>
            <dd className="font-medium text-slate-900">{`${current.itemCode} · ${current.itemName}`}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Usuario</dt>
            <dd className="font-medium text-slate-900">{current.userFullName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Salida</dt>
            <dd>{formatDateTime(current.checkedOutAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Vence</dt>
            <dd>{formatDateTime(current.dueAt)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Estado al entregar</dt>
            <dd>{CONDITION_LABELS[current.deliveryCondition]}</dd>
          </div>
          {current.guarantee && (
            <div>
              <dt className="text-slate-500">Garantía</dt>
              <dd>{current.guarantee.description}</dd>
            </div>
          )}
        </dl>

        {result && (
          <>
            <ReturnEffects loan={result} wasOverdue={wasOverdue} />
            <Link to="/loans" className={PRIMARY_LINK_CLASSES}>
              Volver a préstamos
            </Link>
          </>
        )}
        {!result && current.status === 'RETURNED' && (
          <Alert variant="error">Este préstamo ya fue devuelto.</Alert>
        )}
        {!result && current.status !== 'RETURNED' && (
          <>
            {current.status === 'OVERDUE' && (
              <Alert variant="error">
                Este préstamo está vencido: al devolverlo se sancionará al usuario.
              </Alert>
            )}
            <ReturnForm
              isSubmitting={returnLoan.isPending}
              errorMessage={returnLoan.error ? getErrorMessage(returnLoan.error) : undefined}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </Card>
    </section>
  );
}
