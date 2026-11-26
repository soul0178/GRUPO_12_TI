import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useItem } from '@/features/inventory/hooks/useItems';
import type { Item } from '@/features/inventory/types/inventory';
import { ItemPicker } from '@/features/loans/components/ItemPicker';
import { LoanForm } from '@/features/loans/components/LoanForm';
import type { LoanFormValues } from '@/features/loans/components/LoanForm';
import { UserPicker } from '@/features/loans/components/UserPicker';
import { useCreateLoan } from '@/features/loans/hooks/useLoanMutations';
import type { Loan } from '@/features/loans/types/loan';
import type { Reservation } from '@/features/reservations/types/reservation';
import { useUserLookup } from '@/features/users/hooks/useUsers';
import type { UserSummary } from '@/features/users/types/user';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { PageHeader } from '@/shared/components/PageHeader';
import { PRIMARY_LINK_CLASSES } from '@/shared/components/buttonLinkClasses';
import { formatDateTime } from '@/shared/utils/dateFormat';

/** Pantalla donde el encargado registra la entrega de un ítem a un usuario (RF-04, RF-07). */
export function NewLoanPage() {
  // Si se llega desde "Entregar" en una reserva, el usuario y el ítem vienen elegidos; no se pueden cambiar.
  const reservation = (useLocation().state as { reservation?: Reservation } | null)?.reservation;
  const prefilledItem = useItem(reservation?.itemId);
  const prefilledUsers = useUserLookup(reservation?.userEmail ?? '');
  // Al terminar la entrega de una reserva, la siguiente entrega vuelve a ser libre.
  const [reservationDone, setReservationDone] = useState(false);
  const locked = reservation !== undefined && !reservationDone;
  // undefined = sin tocar (vale la precarga); null = el encargado lo quitó
  const [pickedUser, setPickedUser] = useState<UserSummary | null | undefined>(undefined);
  const [pickedItem, setPickedItem] = useState<Item | null | undefined>(undefined);
  const user =
    pickedUser !== undefined
      ? pickedUser
      : (prefilledUsers.data?.find((candidate) => candidate.id === reservation?.userId) ?? null);
  const item = pickedItem !== undefined ? pickedItem : (prefilledItem.data ?? null);
  const [created, setCreated] = useState<Loan | null>(null);
  const createLoan = useCreateLoan();

  function handleSubmit(values: LoanFormValues) {
    if (!user || !item) {
      return;
    }
    const guaranteeDescription = values.guaranteeDescription?.trim();
    createLoan.mutate(
      {
        userId: user.id,
        itemId: item.id,
        deliveryCondition: values.deliveryCondition,
        deliveryObservations: values.deliveryObservations?.trim() || undefined,
        guarantee:
          item.category.requiresGuarantee && guaranteeDescription
            ? { type: values.guaranteeType, description: guaranteeDescription }
            : undefined,
      },
      { onSuccess: setCreated },
    );
  }

  /** Al cambiar usuario o ítem se descarta el error de un intento anterior, que ya no aplica. */
  function changeSelection<T>(setter: (value: T) => void, value: T) {
    setter(value);
    createLoan.reset();
  }

  function startAnother() {
    setCreated(null);
    setReservationDone(true);
    setPickedUser(null);
    setPickedItem(null);
    createLoan.reset();
  }

  if (created) {
    const message = `${created.itemCode} entregado a ${created.userFullName}. Debe devolverse antes del ${formatDateTime(created.dueAt)}.`;
    return (
      <section>
        <PageHeader title="Entrega registrada" />
        <Card className="max-w-3xl space-y-4 p-6">
          <Alert variant="success">{message}</Alert>
          <div className="flex gap-3">
            <Button onClick={startAnother}>Registrar otra entrega</Button>
            <Link to="/loans" className={PRIMARY_LINK_CLASSES}>
              Ver préstamos
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title="Registrar entrega"
        description="Elija al usuario y el ítem, y complete los datos."
      />
      <Card className="max-w-3xl space-y-6 p-6">
        {locked && reservation && (
          <Alert variant="info">{`Entrega de la reserva de ${reservation.userFullName}: ${reservation.itemCode}, del ${formatDateTime(reservation.startAt)} al ${formatDateTime(reservation.endAt)}.`}</Alert>
        )}
        <UserPicker
          selected={user}
          locked={locked}
          onSelect={(value) => changeSelection(setPickedUser, value)}
        />
        <ItemPicker
          selected={item}
          locked={locked}
          onSelect={(value) => changeSelection(setPickedItem, value)}
        />
        {user && item && (
          <LoanForm
            requiresGuarantee={item.category.requiresGuarantee}
            isSubmitting={createLoan.isPending}
            errorMessage={createLoan.error ? getErrorMessage(createLoan.error) : undefined}
            onSubmit={handleSubmit}
          />
        )}
      </Card>
    </section>
  );
}
