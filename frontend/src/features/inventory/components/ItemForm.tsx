import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ITEM_STATUS_LABELS, MANUAL_ITEM_STATUSES } from '@/features/inventory/types/inventory';
import type { Category, ItemStatus } from '@/features/inventory/types/inventory';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { TextAreaField } from '@/shared/components/TextAreaField';

const itemSchema = z.object({
  code: z.string().trim().min(1, 'El código de inventario es obligatorio'),
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  status: z.enum(['AVAILABLE', 'ON_LOAN', 'OUT_OF_SERVICE', 'RETIRED']),
});

export type ItemFormValues = z.infer<typeof itemSchema>;

interface ItemFormProps {
  mode: 'create' | 'edit';
  categories: Category[];
  initialValues?: Partial<ItemFormValues>;
  /** Estado que el personal no puede cambiar a mano (por ejemplo, ON_LOAN); se muestra como texto fijo. */
  lockedStatus?: ItemStatus;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: ItemFormValues) => void;
}

/** Formulario de alta y edición de ítems (personal). El estado solo se elige al editar. */
export function ItemForm({
  mode,
  categories,
  initialValues,
  lockedStatus,
  isSubmitting,
  errorMessage,
  onSubmit,
}: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { description: '', categoryId: '', status: 'AVAILABLE', ...initialValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Código de inventario"
          error={errors.code?.message}
          {...register('code')}
        />
        <FormField label="Nombre" error={errors.name?.message} {...register('name')} />
        <SelectField
          label="Categoría"
          error={errors.categoryId?.message}
          {...register('categoryId')}
        >
          <option value="">Seleccione una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>
        {mode === 'edit' && !lockedStatus && (
          <SelectField label="Estado" error={errors.status?.message} {...register('status')}>
            {MANUAL_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ITEM_STATUS_LABELS[status]}
              </option>
            ))}
          </SelectField>
        )}
        {mode === 'edit' && lockedStatus && (
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Estado</p>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
              {`${ITEM_STATUS_LABELS[lockedStatus]} (no se puede cambiar manualmente)`}
            </p>
          </div>
        )}
        <TextAreaField
          label="Descripción (opcional)"
          className="sm:col-span-2"
          error={errors.description?.message}
          {...register('description')}
        />
      </div>
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
