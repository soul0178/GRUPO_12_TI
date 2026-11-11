import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { PolicySettings } from '@/features/sanctions/types/sanction';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';

const MAX_ITEMS_LIMIT = 20;
const MAX_EXPIRATION_MINUTES = 1440;

const settingsSchema = z.object({
  maxActiveItems: z
    .number({ error: 'Ingrese un número' })
    .int('Ingrese un número entero')
    .min(1, 'El máximo debe ser al menos 1')
    .max(MAX_ITEMS_LIMIT, `El máximo no puede superar ${MAX_ITEMS_LIMIT}`),
  reservationExpirationMinutes: z
    .number({ error: 'Ingrese un número' })
    .int('Ingrese un número entero')
    .min(1, 'Los minutos deben ser al menos 1')
    .max(
      MAX_EXPIRATION_MINUTES,
      `Los minutos no pueden superar ${MAX_EXPIRATION_MINUTES} (24 horas)`,
    ),
});

interface PolicySettingsFormProps {
  initialValues: PolicySettings;
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
  onSubmit: (values: PolicySettings) => void;
}

/** Formulario de los parámetros de política: ítems activos por usuario y minutos para recoger una reserva. */
export function PolicySettingsForm({
  initialValues,
  isSubmitting,
  errorMessage,
  successMessage,
  onSubmit,
}: PolicySettingsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PolicySettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Máximo de préstamos y reservas por usuario"
          type="number"
          min={1}
          error={errors.maxActiveItems?.message}
          {...register('maxActiveItems', { valueAsNumber: true })}
        />
        <FormField
          label="Minutos para recoger una reserva"
          type="number"
          min={1}
          error={errors.reservationExpirationMinutes?.message}
          {...register('reservationExpirationMinutes', { valueAsNumber: true })}
        />
      </div>
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
