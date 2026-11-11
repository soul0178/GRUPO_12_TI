import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Los nombres son obligatorios'),
  lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
  phone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialValues: ProfileFormValues;
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
  onSubmit: (values: ProfileFormValues) => void;
}

/** Formulario con los datos de contacto que el usuario puede editar (RF-02). */
export function ProfileForm({
  initialValues,
  isSubmitting,
  errorMessage,
  successMessage,
  onSubmit,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Nombres" error={errors.firstName?.message} {...register('firstName')} />
        <FormField label="Apellidos" error={errors.lastName?.message} {...register('lastName')} />
        <FormField label="Teléfono" error={errors.phone?.message} {...register('phone')} />
      </div>
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
