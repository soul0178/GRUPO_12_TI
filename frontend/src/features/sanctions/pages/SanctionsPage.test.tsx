import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SanctionsPage } from '@/features/sanctions/pages/SanctionsPage';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const sanction = (id: number, status = 'SUGGESTED') => ({
  id,
  userId: 10 + id,
  userFullName: `Usuario ${id}`,
  userEmail: `u${id}@epcc.unsa.edu.pe`,
  type: 'DAMAGE',
  status,
  startAt: null,
  endAt: null,
  reason: `Pantalla rota ${id}`,
  loanId: 5,
  createdAt: '2026-03-10T15:30:00Z',
});

const page = (content: unknown[]) => ({
  content,
  page: 0,
  size: 10,
  totalElements: content.length,
  totalPages: 1,
});

describe('SanctionsPage', () => {
  it('muestra la carga y luego las sanciones sugeridas', async () => {
    server.use(http.get(`${API}/sanctions`, () => HttpResponse.json(page([sanction(1)]))));
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);

    expect(screen.getByText('Cargando sanciones...')).toBeInTheDocument();
    expect(await screen.findByText('Usuario 1')).toBeInTheDocument();
    expect(screen.getByText('Pantalla rota 1')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay sanciones', async () => {
    server.use(http.get(`${API}/sanctions`, () => HttpResponse.json(page([]))));
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);

    expect(await screen.findByText('No hay sanciones para mostrar.')).toBeInTheDocument();
  });

  it('muestra el error del backend', async () => {
    server.use(
      http.get(`${API}/sanctions`, () =>
        HttpResponse.json({ status: 500, detail: 'Ocurrió un error inesperado' }, { status: 500 }),
      ),
    );
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);

    expect(await screen.findByText('Ocurrió un error inesperado')).toBeInTheDocument();
  });

  it('el administrador confirma una sanción con los días indicados', async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/sanctions`, () => HttpResponse.json(page([sanction(1)]))),
      http.post(`${API}/sanctions/1/confirm`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(sanction(1, 'ACTIVE'));
      }),
    );
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);
    const days = await screen.findByLabelText('Días de suspensión para Usuario 1');

    await userEvent.clear(days);
    await userEvent.type(days, '5');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await vi.waitFor(() => expect(body).toEqual({ days: 5 }));
  });

  it('el administrador rechaza una sanción', async () => {
    let rejected = false;
    server.use(
      http.get(`${API}/sanctions`, () => HttpResponse.json(page([sanction(1)]))),
      http.post(`${API}/sanctions/1/reject`, () => {
        rejected = true;
        return HttpResponse.json(sanction(1, 'REJECTED'));
      }),
    );
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));

    await vi.waitFor(() => expect(rejected).toBe(true));
  });

  it('no permite confirmar con días inválidos', async () => {
    server.use(http.get(`${API}/sanctions`, () => HttpResponse.json(page([sanction(1)]))));
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);
    const days = await screen.findByLabelText('Días de suspensión para Usuario 1');

    await userEvent.clear(days);
    await userEvent.type(days, '0');

    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
  });

  it('el encargado solo consulta: no ve acciones', async () => {
    server.use(http.get(`${API}/sanctions`, () => HttpResponse.json(page([sanction(1)]))));
    loginAs('MANAGER');
    renderWithProviders(<SanctionsPage />);
    await screen.findByText('Usuario 1');

    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
  });

  it('envía el estado elegido en el filtro', async () => {
    const statuses: (string | null)[] = [];
    server.use(
      http.get(`${API}/sanctions`, ({ request }) => {
        statuses.push(new URL(request.url).searchParams.get('status'));
        return HttpResponse.json(page([sanction(1, 'ACTIVE')]));
      }),
    );
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);
    await screen.findByText('Usuario 1');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'ACTIVE');

    await vi.waitFor(() => expect(statuses).toContain('ACTIVE'));
    expect(statuses[0]).toBe('SUGGESTED');
  });
});
