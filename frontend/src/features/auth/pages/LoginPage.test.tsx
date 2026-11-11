import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { useAuthStore } from '@/features/auth/store/authStore';
import { server } from '@/test/mocks/server';
import { renderWithProviders } from '@/test/renderWithProviders';

const LOGIN_URL = 'http://localhost:8080/api/auth/login';

describe('LoginPage', () => {
  it('muestra errores si el formulario está vacío', async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('El correo es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
  });

  it('muestra error si el correo no es válido', async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Correo institucional'), 'no-es-correo');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave1234');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('El correo no es válido')).toBeInTheDocument();
  });

  it('guarda la sesión cuando las credenciales son correctas', async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json({
          token: 'jwt-123',
          user: {
            id: 7,
            firstName: 'Luis',
            lastName: 'Mamani',
            email: 'luis@epcc.unsa.edu.pe',
            role: 'MANAGER',
          },
        }),
      ),
    );
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Correo institucional'), 'luis@epcc.unsa.edu.pe');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave1234');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(useAuthStore.getState().token).toBe('jwt-123'));
    expect(useAuthStore.getState().user?.role).toBe('MANAGER');
  });

  it('muestra el mensaje del backend cuando las credenciales son incorrectas', async () => {
    server.use(
      http.post(LOGIN_URL, () =>
        HttpResponse.json(
          { status: 401, detail: 'Correo o contraseña incorrectos' },
          { status: 401 },
        ),
      ),
    );
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText('Correo institucional'), 'luis@epcc.unsa.edu.pe');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
