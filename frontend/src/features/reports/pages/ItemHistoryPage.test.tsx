import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { loanFixture, pageOf } from '@/features/loans/testFixtures';
import { ItemHistoryPage } from '@/features/reports/pages/ItemHistoryPage';
import { reportFixture } from '@/features/reports/testFixtures';
import { server } from '@/test/mocks/server';
import { loginAs, renderRoutes } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

function renderAt(path: string) {
  return renderRoutes([{ path: '/reports/items/:id?', element: <ItemHistoryPage /> }], path);
}

const itemSubject = { id: 5, name: 'EQ-001 · Laptop', detail: 'Equipo' };

describe('ItemHistoryPage', () => {
  it('busca entre todos los ítems, sin limitarse a los disponibles', async () => {
    const statuses: (string | null)[] = [];
    server.use(
      http.get(`${API}/items`, ({ request }) => {
        statuses.push(new URL(request.url).searchParams.get('status'));
        return HttpResponse.json(
          pageOf([
            {
              id: 5,
              code: 'EQ-001',
              name: 'Laptop',
              description: null,
              status: 'ON_LOAN',
              category: { id: 1, name: 'Equipo', maxLoanHours: 4, requiresGuarantee: true },
              createdAt: '2026-03-01T00:00:00Z',
            },
          ]),
        );
      }),
      http.get(`${API}/reports/items/5/loans`, () =>
        HttpResponse.json(reportFixture([loanFixture()], { subject: itemSubject })),
      ),
    );
    loginAs('MANAGER');
    renderAt('/reports/items');

    await userEvent.click(await screen.findByRole('button', { name: /EQ-001 · Laptop/ }));

    expect(await screen.findByRole('heading', { name: 'EQ-001 · Laptop' })).toBeInTheDocument();
    expect(statuses.every((status) => status === null)).toBe(true);
  });

  it('muestra el historial del ítem con el usuario de cada préstamo', async () => {
    server.use(
      http.get(`${API}/reports/items/5/loans`, () =>
        HttpResponse.json(
          reportFixture(
            [
              loanFixture({ id: 1, userFullName: 'Luis Quispe' }),
              loanFixture({ id: 2, userFullName: 'María Torres', status: 'OVERDUE' }),
            ],
            { subject: itemSubject },
          ),
        ),
      ),
    );
    loginAs('ADMIN');
    renderAt('/reports/items/5');

    expect(await screen.findByRole('heading', { name: 'EQ-001 · Laptop' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Usuario' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Luis Quispe')).toBeInTheDocument();
    expect(within(table).getByText('María Torres')).toBeInTheDocument();
    expect(within(table).getByText('Vencido')).toBeInTheDocument();
  });

  it('ofrece volver a elegir otro ítem', async () => {
    server.use(
      http.get(`${API}/reports/items/5/loans`, () =>
        HttpResponse.json(reportFixture([loanFixture()], { subject: itemSubject })),
      ),
    );
    loginAs('MANAGER');
    renderAt('/reports/items/5');

    const link = await screen.findByRole('link', { name: 'Cambiar ítem' });
    expect(link).toHaveAttribute('href', '/reports/items');
  });
});
