import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { UserFormPage } from '@/features/users/pages/UserFormPage';
import { server } from '@/test/mocks/server';
import { loginAs, renderRoutes } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const routes = [
  { path: '/users/new', element: <UserFormPage /> },
  { path: '/users', element: <p>Listado de usuarios</p> },
];

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('Nombres'), 'Ana');
  await userEvent.type(screen.getByLabelText('Apellidos'), 'Pérez');
  await userEvent.type(screen.getByLabelText('Correo institucional'), 'ana@epcc.unsa.edu.pe');
  await userEvent.type(screen.getByLabelText('Código o DNI'), '20201234');
  await userEvent.type(screen.getByLabelText('Contraseña inicial'), 'Clave1234');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
}

describe('UserFormPage', () => {
  beforeEach(() => loginAs('ADMIN'));

  it('crea el usuario y vuelve al listado', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/users`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 9 }, { status: 201 });
      }),
    );
    renderRoutes(routes, '/users/new');

    await fillValidForm();

    expect(await screen.findByText('Listado de usuarios')).toBeInTheDocument();
    expect(body).toMatchObject({
      email: 'ana@epcc.unsa.edu.pe',
      password: 'Clave1234',
      role: 'STUDENT',
    });
  });

  it('muestra el mensaje del backend si el correo ya existe', async () => {
    server.use(
      http.post(`${API}/users`, () =>
        HttpResponse.json(
          { status: 409, detail: 'Ya existe un usuario con el correo ana@epcc.unsa.edu.pe' },
          { status: 409 },
        ),
      ),
    );
    renderRoutes(routes, '/users/new');

    await fillValidForm();

    expect(await screen.findByText(/Ya existe un usuario con el correo/)).toBeInTheDocument();
  });
});
