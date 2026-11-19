import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { loanFixture } from '@/features/loans/testFixtures';
import { reportFixture } from '@/features/reports/testFixtures';
import { UserHistoryPage } from '@/features/reports/pages/UserHistoryPage';
import { server } from '@/test/mocks/server';
import { loginAs, renderRoutes } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

function renderAt(path: string) {
  return renderRoutes(
    [
      { path: '/reports/users/:id?', element: <UserHistoryPage /> },
      { path: '/reports/items', element: <p>Reporte por ítem</p> },
    ],
    path,
  );
}

describe('UserHistoryPage', () => {
  it('pide elegir un usuario cuando la ruta no trae id', async () => {
    server.use(
      http.get(`${API}/users/lookup`, () =>
        HttpResponse.json([
          {
            id: 20,
            firstName: 'Luis',
            lastName: 'Quispe',
            email: 'luis@epcc.unsa.edu.pe',
            documentNumber: '72345678',
            role: 'STUDENT',
            active: true,
          },
        ]),
      ),
      http.get(`${API}/reports/users/20/loans`, () => HttpResponse.json(reportFixture())),
    );
    loginAs('MANAGER');
    renderAt('/reports/users');

    await userEvent.type(screen.getByLabelText('Buscar usuario'), 'luis');
    await userEvent.click(await screen.findByRole('button', { name: /Luis Quispe/ }));

    expect(await screen.findByRole('heading', { name: 'Luis Quispe' })).toBeInTheDocument();
  });

  it('muestra la lista de todos los usuarios sin escribir nada', async () => {
    const person = (id: number, firstName: string, lastName: string) => ({
      id,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}@epcc.unsa.edu.pe`,
      documentNumber: `7000000${id}`,
      role: 'STUDENT',
      active: true,
    });
    server.use(
      http.get(`${API}/users/lookup`, () =>
        HttpResponse.json([person(1, 'Ana', 'Rojas'), person(2, 'Luis', 'Quispe')]),
      ),
    );
    loginAs('MANAGER');
    renderAt('/reports/users');

    expect(await screen.findByRole('button', { name: /Ana Rojas/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Luis Quispe/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar usuario')).toHaveValue('');
  });

  it('muestra el resumen y el historial del usuario', async () => {
    server.use(
      http.get(`${API}/reports/users/20/loans`, () =>
        HttpResponse.json(
          reportFixture([
            loanFixture({ id: 1, itemCode: 'EQ-001' }),
            loanFixture({
              id: 2,
              itemCode: 'LB-010',
              status: 'RETURNED',
              dueAt: '2026-03-10T19:00:00Z',
              returnedAt: '2026-03-10T21:00:00Z',
              returnedByName: 'Ana Pérez',
              returnCondition: 'DAMAGED',
            }),
          ]),
        ),
      ),
    );
    loginAs('MANAGER');
    renderAt('/reports/users/20');

    expect(screen.getByText('Cargando historial...')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Luis Quispe' })).toBeInTheDocument();
    expect(screen.getByText('luis@epcc.unsa.edu.pe · 72345678')).toBeInTheDocument();
    const total = screen.getByText('Total').parentElement as HTMLElement;
    expect(within(total).getByText('7')).toBeInTheDocument();
    const late = screen.getByText('Devueltos con atraso').parentElement as HTMLElement;
    expect(within(late).getByText('3')).toBeInTheDocument();
    expect(screen.getByText('EQ-001')).toBeInTheDocument();
    expect(screen.getByText('LB-010')).toBeInTheDocument();
    expect(screen.getByText('Con atraso')).toBeInTheDocument();
    expect(screen.getByText(/Bueno → Dañado/)).toBeInTheDocument();
  });

  it('envía las fechas y el estado elegidos como filtros', async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/reports/users/20/loans`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(reportFixture());
      }),
    );
    loginAs('ADMIN');
    renderAt('/reports/users/20');
    await screen.findByRole('heading', { name: 'Luis Quispe' });

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'OVERDUE');
    await userEvent.type(screen.getByLabelText('Desde'), '2026-03-01');

    await screen.findByRole('heading', { name: 'Luis Quispe' });
    const last = new URL(urls[urls.length - 1] as string);
    expect(last.searchParams.get('status')).toBe('OVERDUE');
    expect(last.searchParams.get('from')).toBe('2026-03-01');
    expect(last.searchParams.get('to')).toBeNull();
    expect(last.searchParams.get('page')).toBe('0');
  });

  it('muestra un mensaje cuando no hay préstamos para los filtros', async () => {
    server.use(
      http.get(`${API}/reports/users/20/loans`, () => HttpResponse.json(reportFixture([]))),
    );
    loginAs('MANAGER');
    renderAt('/reports/users/20');

    expect(await screen.findByText('No hay préstamos para esos filtros.')).toBeInTheDocument();
  });

  it('muestra el error del servidor cuando el usuario no existe', async () => {
    server.use(
      http.get(`${API}/reports/users/99/loans`, () =>
        HttpResponse.json(
          { status: 404, detail: 'No existe el usuario con id 99' },
          { status: 404 },
        ),
      ),
    );
    loginAs('MANAGER');
    renderAt('/reports/users/99');

    expect(await screen.findByRole('alert')).toHaveTextContent('No existe el usuario con id 99');
  });

  it('permite cambiar a la pestaña por ítem', async () => {
    loginAs('MANAGER');
    renderAt('/reports/users');

    await userEvent.click(screen.getByRole('link', { name: 'Por ítem' }));

    expect(await screen.findByText('Reporte por ítem')).toBeInTheDocument();
  });
});
