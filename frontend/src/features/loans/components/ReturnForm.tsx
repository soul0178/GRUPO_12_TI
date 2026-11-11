import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CONDITIONS, CONDITION_LABELS } from '@/features/loans/types/loan';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { SelectField } from '@/shared/components/SelectField';
import { TextAreaField } from '@/shared/components/TextAreaField';

const returnSchema = z.object({
  returnCondition: z.enum(['GOOD', 'FAIR', 'DAMAGED']),
  returnObservations: z.string().optional(),
});

export type ReturnFormValues = z.infer<typeof returnSchema>;

interface ReturnFormProps {
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: ReturnFormValues) => void;
}

/** Datos de la devolución: estado físico al recibir el ítem y observaciones. */
export function ReturnForm({ isSubmitting, errorMessage, onSubmit }: ReturnFormProps) {
  const { register, handleSubmit } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { returnCondition: 'GOOD', returnObservations: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <SelectField label="Estado físico al devolver" {...register('returnCondition')}>
        {CONDITIONS.map((condition) => (
          <option key={condition} value={condition}>
            {CONDITION_LABELS[condition]}
          </option>
        ))}
      </SelectField>
      <TextAreaField label="Observaciones (opcional)" {...register('returnObservations')} />
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registrando...' : 'Registrar devolución'}
      </Button>
    </form>
  );
}
