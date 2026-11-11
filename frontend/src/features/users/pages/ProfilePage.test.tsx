import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ProfilePage } from '@/features/users/pages/ProfilePage';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const profile = {
  id: 1,
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@epcc.unsa.edu.pe',
  documentNumber: '20201234',
  phone: '999111222',
  role: 'STUDENT',
  active: true,
  createdAt: '2026-03-10T15:30:00Z',
};

const emptyPage = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };

describe('ProfilePage', () => {
  beforeEach(() => {
    loginAs('STUDENT');
    server.use(
      http.get(`${API}/me`, () => HttpResponse.json(profile)),
      http.get(`${API}/me/sanctions`, () => HttpResponse.json(emptyPage)),
    );
  });

  it('muestra los datos del perfil', async () => {
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText('ana@epcc.unsa.edu.pe')).toBeInTheDocument();
    expect(screen.getByText('Estudiante')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombres')).toHaveValue('Ana');
  });

  it('actualiza el contacto y refresca el nombre de la sesión', async () => {
    server.use(http.put(`${API}/me`, () => HttpResponse.json({ ...profile, firstName: 'Anita' })));
    renderWithProviders(<ProfilePage />);
    await screen.findByText('ana@epcc.unsa.edu.pe');

    await userEvent.clear(screen.getByLabelText('Nombres'));
    await userEvent.type(screen.getByLabelText('Nombres'), 'Anita');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Perfil actualizado')).toBeInTheDocument();
    expect(useAuthStore.getState().user?.firstName).toBe('Anita');
  });

  it('valida que las contraseñas nuevas coincidan', async () => {
    renderWithProviders(<ProfilePage />);
    await screen.findByText('ana@epcc.unsa.edu.pe');

    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'Clave1234');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave99');
    await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'), 'Distinta99');
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
  });

  it('muestra el error del backend si la contraseña actual es incorrecta', async () => {
    server.use(
      http.put(`${API}/me/password`, () =>
        HttpResponse.json(
          { status: 409, detail: 'La contraseña actual es incorrecta' },
          { status: 409 },
        ),
      ),
    );
    renderWithProviders(<ProfilePage />);
    await screen.findByText('ana@epcc.unsa.edu.pe');

    await userEvent.type(screen.getByLabelText('Contraseña actual'), 'mala');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave99');
    await userEvent.type(screen.getByLabelText('Confirmar nueva contraseña'), 'NuevaClave99');
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));

    expect(await screen.findByText('La contraseña actual es incorrecta')).toBeInTheDocument();
  });

  it('avisa cuando el usuario tiene una sanción activa', async () => {
    server.use(
      http.get(`${API}/me/sanctions`, () =>
        HttpResponse.json({
          ...emptyPage,
          totalElements: 1,
          content: [
            {
              id: 1,
              userId: 1,
              userFullName: 'Ana Pérez',
              userEmail: 'ana@epcc.unsa.edu.pe',
              type: 'OVERDUE',
              status: 'ACTIVE',
              startAt: '2026-03-10T15:30:00Z',
              endAt: '2026-03-12T15:30:00Z',
              reason: 'Devolución tardía del préstamo 4',
              loanId: 4,
              createdAt: '2026-03-10T15:30:00Z',
            },
          ],
        }),
      ),
    );
    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText('Tiene una sanción activa')).toBeInTheDocument();
    expect(screen.getByText('Devolución tardía del préstamo 4')).toBeInTheDocument();
  });

  it('no muestra aviso de sanción cuando no hay sanciones activas', async () => {
    renderWithProviders(<ProfilePage />);
    await screen.findByText('ana@epcc.unsa.edu.pe');

    expect(screen.queryByText('Tiene una sanción activa')).not.toBeInTheDocument();
  });
});
