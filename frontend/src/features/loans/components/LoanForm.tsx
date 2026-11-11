import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  CONDITIONS,
  CONDITION_LABELS,
  GUARANTEE_TYPES,
  GUARANTEE_TYPE_LABELS,
} from '@/features/loans/types/loan';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { TextAreaField } from '@/shared/components/TextAreaField';

const loanSchema = z.object({
  deliveryCondition: z.enum(['GOOD', 'FAIR', 'DAMAGED']),
  deliveryObservations: z.string().optional(),
  guaranteeType: z.enum(['DNI', 'UNIVERSITY_ID', 'OTHER']),
  guaranteeDescription: z.string().optional(),
});

export type LoanFormValues = z.infer<typeof loanSchema>;

interface LoanFormProps {
  /** Si la categoría del ítem exige garantía, se muestran sus campos y la descripción es obligatoria. */
  requiresGuarantee: boolean;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: LoanFormValues) => void;
}

/** Datos de la entrega: estado físico, observaciones y garantía (si la categoría la exige). */
export function LoanForm({
  requiresGuarantee,
  isSubmitting,
  errorMessage,
  onSubmit,
}: LoanFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      deliveryCondition: 'GOOD',
      deliveryObservations: '',
      guaranteeType: 'DNI',
      guaranteeDescription: '',
    },
  });

  function submit(values: LoanFormValues) {
    if (requiresGuarantee && !values.guaranteeDescription?.trim()) {
      setError('guaranteeDescription', { message: 'La descripción de la garantía es obligatoria' });
      return;
    }
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <SelectField
        label="Estado físico al entregar"
        error={errors.deliveryCondition?.message}
        {...register('deliveryCondition')}
      >
        {CONDITIONS.map((condition) => (
          <option key={condition} value={condition}>
            {CONDITION_LABELS[condition]}
          </option>
        ))}
      </SelectField>
      <TextAreaField
        label="Observaciones (opcional)"
        error={errors.deliveryObservations?.message}
        {...register('deliveryObservations')}
      />
      {requiresGuarantee && (
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Tipo de garantía" {...register('guaranteeType')}>
            {GUARANTEE_TYPES.map((type) => (
              <option key={type} value={type}>
                {GUARANTEE_TYPE_LABELS[type]}
              </option>
            ))}
          </SelectField>
          <FormField
            label="Descripción de la garantía"
            error={errors.guaranteeDescription?.message}
            {...register('guaranteeDescription')}
          />
        </div>
      )}
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registrando...' : 'Registrar entrega'}
      </Button>
    </form>
  );
}
