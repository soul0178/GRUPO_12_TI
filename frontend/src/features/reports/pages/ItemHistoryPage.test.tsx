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
  it('permite listar solo los ítems dañados o dados de baja', async () => {
    const statuses: (string | null)[] = [];
    const category = { id: 1, name: 'Equipo', maxLoanHours: 4, requiresGuarantee: true };
    server.use(
      http.get(`${API}/items`, ({ request }) => {
        const status = new URL(request.url).searchParams.get('status');
        statuses.push(status);
        return HttpResponse.json(
          pageOf(
            status === 'OUT_OF_SERVICE'
              ? [
                  {
                    id: 3,
                    code: 'EQ-003',
                    name: 'Proyector',
                    description: null,
                    category,
                    status: 'OUT_OF_SERVICE',
                    createdAt: '2026-03-01T00:00:00Z',
                  },
                ]
              : [],
          ),
        );
      }),
    );
    loginAs('MANAGER');
    renderAt('/reports/items');

    await userEvent.selectOptions(
      await screen.findByLabelText('Estado del ítem'),
      'OUT_OF_SERVICE',
    );

    expect(await screen.findByText('EQ-003 · Proyector')).toBeInTheDocument();
    expect(statuses).toContain('OUT_OF_SERVICE');
  });

  it('muestra desde el inicio todos los ítems (equipos, libros y objetos), no solo los primeros', async () => {
    const sizes: (string | null)[] = [];
    const category = (id: number, name: string) => ({
      id,
      name,
      maxLoanHours: 24,
      requiresGuarantee: false,
    });
    const base = { description: null, status: 'AVAILABLE', createdAt: '2026-03-01T00:00:00Z' };
    const all = [
      ...Array.from({ length: 8 }, (_, i) => ({
        ...base,
        id: i + 1,
        code: `EQ-00${i + 1}`,
        name: `Equipo ${i + 1}`,
        category: category(1, 'Equipo'),
      })),
      { ...base, id: 9, code: 'LB-001', name: 'Cormen', category: category(2, 'Libro') },
      { ...base, id: 10, code: 'OB-001', name: 'Puntero', category: category(3, 'Objeto') },
    ];
    server.use(
      http.get(`${API}/items`, ({ request }) => {
        sizes.push(new URL(request.url).searchParams.get('size'));
        return HttpResponse.json(pageOf(all));
      }),
    );
    loginAs('MANAGER');
    renderAt('/reports/items');

    expect(await screen.findByRole('button', { name: /EQ-001 · Equipo 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /LB-001 · Cormen/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OB-001 · Puntero/ })).toBeInTheDocument();
    expect(sizes.every((size) => Number(size) >= 20)).toBe(true);
  });

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
