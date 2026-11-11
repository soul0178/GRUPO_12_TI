import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getErrorMessage } from '@/shared/api/getErrorMessage';
import { Alert } from '@/shared/components/Alert';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').pipe(z.email('El correo no es válido')),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Pantalla de inicio de sesión con correo y contraseña (RF-01). */
export function LoginPage() {
  const token = useAuthStore((state) => state.token);
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center text-white">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold ring-1 ring-white/30">
            EP
          </span>
          <p className="mt-4 text-sm font-medium text-indigo-100">
            Escuela Profesional de Ciencia de la Computación
          </p>
          <p className="text-xs text-indigo-200">Universidad Nacional de San Agustín</p>
        </div>
        <Card className="p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500">Ingrese con su correo institucional.</p>
          <form
            onSubmit={handleSubmit((values) => login.mutate(values))}
            noValidate
            className="mt-6 space-y-4"
          >
            <FormField
              label="Correo institucional"
              type="email"
              autoComplete="username"
              error={errors.email?.message}
              {...register('email')}
            />
            <FormField
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {login.isError && <Alert variant="error">{getErrorMessage(login.error)}</Alert>}
            <Button type="submit" disabled={login.isPending} className="w-full">
              {login.isPending ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
