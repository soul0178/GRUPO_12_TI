import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { RETURN_CONDITIONS, CONDITION_LABELS } from '@/features/loans/types/loan';
import { DAMAGE_LEVELS, DAMAGE_LEVEL_LABELS } from '@/features/sanctions/types/sanction';
import { DAMAGE_LEVEL_INFO, SANCTION_DAYS } from '@/features/sanctions/types/sanctionPolicy';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { SelectField } from '@/shared/components/SelectField';
import { TextAreaField } from '@/shared/components/TextAreaField';

const returnSchema = z.object({
  returnCondition: z.enum(['GOOD', 'FAIR', 'DAMAGED', 'LOST']),
  damageLevel: z.enum(['MINOR', 'MODERATE', 'SEVERE']),
  returnObservations: z.string().optional(),
});

export type ReturnFormValues = z.infer<typeof returnSchema>;

interface ReturnFormProps {
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: ReturnFormValues) => void;
}

/** Datos de la devolución: estado físico (con nivel de daño o pérdida) y observaciones. */
export function ReturnForm({ isSubmitting, errorMessage, onSubmit }: ReturnFormProps) {
  const { register, handleSubmit, control } = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: { returnCondition: 'GOOD', damageLevel: 'MODERATE', returnObservations: '' },
  });
  const condition = useWatch({ control, name: 'returnCondition' });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <SelectField label="Estado físico al devolver" {...register('returnCondition')}>
        {RETURN_CONDITIONS.map((value) => (
          <option key={value} value={value}>
            {CONDITION_LABELS[value]}
          </option>
        ))}
      </SelectField>
      {condition === 'DAMAGED' && (
        <SelectField label="Nivel del daño" {...register('damageLevel')}>
          {DAMAGE_LEVELS.map((level) => (
            <option key={level} value={level}>
              {`${DAMAGE_LEVEL_LABELS[level]} (${DAMAGE_LEVEL_INFO[level].days} días): ${DAMAGE_LEVEL_INFO[level].examples}`}
            </option>
          ))}
        </SelectField>
      )}
      {condition === 'LOST' && (
        <Alert variant="error">
          {`El ítem se dará de baja y se aplicará la sanción máxima (${SANCTION_DAYS.loss} días). La garantía queda retenida.`}
        </Alert>
      )}
      <TextAreaField label="Observaciones (opcional)" {...register('returnObservations')} />
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Registrando...' : 'Registrar devolución'}
      </Button>
    </form>
  );
}
