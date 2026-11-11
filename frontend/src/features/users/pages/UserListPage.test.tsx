import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { UserListPage } from '@/features/users/pages/UserListPage';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const user = (id: number, active = true) => ({
  id,
  firstName: `Nombre${id}`,
  lastName: `Apellido${id}`,
  email: `u${id}@epcc.unsa.edu.pe`,
  documentNumber: `1000${id}`,
  phone: null,
  role: 'STUDENT',
  active,
  createdAt: '2026-03-10T15:30:00Z',
});

const page = (content: unknown[]) => ({
  content,
  page: 0,
  size: 10,
  totalElements: content.length,
  totalPages: 1,
});

describe('UserListPage', () => {
  beforeEach(() => loginAs('ADMIN', { id: 1 }));

  it('muestra el estado de carga y luego los usuarios', async () => {
    server.use(http.get(`${API}/users`, () => HttpResponse.json(page([user(2), user(3)]))));
    renderWithProviders(<UserListPage />);

    expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
    expect(await screen.findByText('Nombre2 Apellido2')).toBeInTheDocument();
    expect(screen.getByText('u3@epcc.unsa.edu.pe')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay usuarios', async () => {
    server.use(http.get(`${API}/users`, () => HttpResponse.json(page([]))));
    renderWithProviders(<UserListPage />);

    expect(await screen.findByText('No hay usuarios registrados.')).toBeInTheDocument();
  });

  it('muestra el error del backend', async () => {
    server.use(
      http.get(`${API}/users`, () =>
        HttpResponse.json(
          { status: 403, detail: 'No tiene permiso para realizar esta acción' },
          { status: 403 },
        ),
      ),
    );
    renderWithProviders(<UserListPage />);

    expect(
      await screen.findByText('No tiene permiso para realizar esta acción'),
    ).toBeInTheDocument();
  });

  it('desactiva un usuario y no permite desactivarse a sí mismo', async () => {
    let deactivated = false;
    server.use(
      http.get(`${API}/users`, () => HttpResponse.json(page([user(1), user(2, !deactivated)]))),
      http.post(`${API}/users/2/deactivate`, () => {
        deactivated = true;
        return HttpResponse.json(user(2, false));
      }),
    );
    renderWithProviders(<UserListPage />);
    await screen.findByText('Nombre2 Apellido2');

    expect(screen.getAllByRole('button', { name: 'Desactivar' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Desactivar' }));

    expect(await screen.findByRole('button', { name: 'Activar' })).toBeInTheDocument();
  });
});
