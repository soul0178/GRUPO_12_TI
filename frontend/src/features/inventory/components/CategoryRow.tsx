import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { Category } from '@/features/inventory/types/inventory';
import { Button } from '@/shared/components/Button';
import { INPUT_CLASSES } from '@/shared/components/FormField';
import { formatHours } from '@/shared/utils/formatDuration';

const MAX_LOAN_HOURS_LIMIT = 720;

const categorySchema = z.object({
  maxLoanHours: z
    .number({ error: 'Ingrese un número de horas' })
    .int('Ingrese un número entero de horas')
    .min(1, 'El plazo debe ser de al menos 1 hora')
    .max(MAX_LOAN_HOURS_LIMIT, `El plazo no puede superar ${MAX_LOAN_HOURS_LIMIT} horas (30 días)`),
  requiresGuarantee: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryRowProps {
  category: Category;
  isSaving: boolean;
  onSave: (values: CategoryFormValues) => void;
}

/** Fila editable de una categoría: plazo máximo en horas y si exige garantía. */
export function CategoryRow({ category, isSaving, onSave }: CategoryRowProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      maxLoanHours: category.maxLoanHours,
      requiresGuarantee: category.requiresGuarantee,
    },
  });
  const hours = useWatch({ control, name: 'maxLoanHours' });

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      noValidate
      className="grid items-start gap-4 px-6 py-5 sm:grid-cols-[1fr_2fr_1fr_auto]"
    >
      <p className="pt-2 text-sm font-semibold text-slate-900">{category.name}</p>
      <div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            aria-label={`Plazo máximo en horas de ${category.name}`}
            aria-invalid={errors.maxLoanHours ? true : undefined}
            className={`${INPUT_CLASSES} max-w-28`}
            {...register('maxLoanHours', { valueAsNumber: true })}
          />
          <span className="text-sm text-slate-500">
            {Number.isFinite(hours) ? formatHours(hours) : ''}
          </span>
        </div>
        {errors.maxLoanHours && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.maxLoanHours.message}
          </p>
        )}
      </div>
      <label className="flex items-center gap-2 pt-2 text-sm text-slate-700">
        <input
          type="checkbox"
          aria-label={`Requiere garantía en ${category.name}`}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
          {...register('requiresGuarantee')}
        />
        Requiere garantía
      </label>
      <Button type="submit" size="sm" disabled={isSaving} className="justify-self-end">
        {isSaving ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  );
}
