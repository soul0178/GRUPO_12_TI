import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ROLES, ROLE_LABELS } from '@/features/users/types/user';
import type { Role } from '@/features/auth/types/auth';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';

const MIN_PASSWORD_LENGTH = 8;

/** Esquema del formulario; la contraseña solo es obligatoria al crear un usuario. */
function buildSchema(mode: 'create' | 'edit') {
  return z
    .object({
      firstName: z.string().trim().min(1, 'Los nombres son obligatorios'),
      lastName: z.string().trim().min(1, 'Los apellidos son obligatorios'),
      email: z.string().min(1, 'El correo es obligatorio').pipe(z.email('El correo no es válido')),
      documentNumber: z.string().trim().min(1, 'El código o DNI es obligatorio'),
      phone: z.string().optional(),
      password: z.string().optional(),
      role: z.enum(ROLES as [Role, ...Role[]], { error: 'El rol es obligatorio' }),
    })
    .superRefine((values, context) => {
      if (mode === 'create' && (values.password ?? '').length < MIN_PASSWORD_LENGTH) {
        context.addIssue({
          code: 'custom',
          path: ['password'],
          message: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
        });
      }
    });
}

export type UserFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface UserFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<UserFormValues>;
  isSubmitting: boolean;
  /** Mensaje de error devuelto por el backend (por ejemplo, correo duplicado). */
  errorMessage?: string;
  onSubmit: (values: UserFormValues) => void;
}

/** Formulario de alta y edición de usuarios (solo ADMIN). */
export function UserForm({
  mode,
  initialValues,
  isSubmitting,
  errorMessage,
  onSubmit,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(buildSchema(mode)),
    defaultValues: { phone: '', password: '', role: 'STUDENT', ...initialValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Nombres" error={errors.firstName?.message} {...register('firstName')} />
        <FormField label="Apellidos" error={errors.lastName?.message} {...register('lastName')} />
        <FormField
          label="Correo institucional"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          label="Código o DNI"
          error={errors.documentNumber?.message}
          {...register('documentNumber')}
        />
        <FormField
          label="Teléfono (opcional)"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <SelectField label="Rol" error={errors.role?.message} {...register('role')}>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </SelectField>
        {mode === 'create' && (
          <FormField
            label="Contraseña inicial"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
        )}
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
