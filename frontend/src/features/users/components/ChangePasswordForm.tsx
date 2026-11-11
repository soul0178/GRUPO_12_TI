import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';

const MIN_PASSWORD_LENGTH = 8;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      ),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface ChangePasswordFormProps {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
  onSubmit: (values: { currentPassword: string; newPassword: string }) => void;
}

/** Formulario para cambiar la contraseña propia: pide la actual y confirma la nueva (RF-02). */
export function ChangePasswordForm({
  isSubmitting,
  errorMessage,
  successMessage,
  onSubmit,
}: ChangePasswordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  function submit(values: PasswordFormValues) {
    onSubmit({ currentPassword: values.currentPassword, newPassword: values.newPassword });
    reset();
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <FormField
        label="Contraseña actual"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <FormField
          label="Confirmar nueva contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>
      {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Cambiando...' : 'Cambiar contraseña'}
        </Button>
      </div>
    </form>
  );
}
