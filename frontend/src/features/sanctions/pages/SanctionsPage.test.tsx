import { screen, waitFor } from '@testing-library/react';
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
  it('filtra las sanciones por el usuario buscado', async () => {
    const texts: Array<string | null> = [];
    server.use(
      http.get(`${API}/sanctions`, ({ request }) => {
        texts.push(new URL(request.url).searchParams.get('text'));
        return HttpResponse.json(page([sanction(1)]));
      }),
    );
    loginAs('MANAGER');
    renderWithProviders(<SanctionsPage />);
    await screen.findByText('Usuario 1');

    await userEvent.type(screen.getByLabelText('Buscar usuario'), 'luis');

    await waitFor(() => expect(texts).toContain('luis'));
  });

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

    await vi.waitFor(() => expect(body).toEqual({ days: 5, damageLevel: 'MODERATE' }));
  });

  it('el administrador confirma sin días y con otro nivel: se aplica la política', async () => {
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

    await userEvent.selectOptions(
      await screen.findByLabelText('Nivel del daño para Usuario 1'),
      'SEVERE',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    await vi.waitFor(() => expect(body).toEqual({ damageLevel: 'SEVERE' }));
  });

  it('el administrador levanta una sanción activa con un motivo', async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/sanctions`, () => HttpResponse.json(page([sanction(1, 'ACTIVE')]))),
      http.post(`${API}/sanctions/1/lift`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(sanction(1, 'LIFTED'));
      }),
    );
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Levantar' }));
    const confirm = screen.getByRole('button', { name: 'Confirmar levantamiento' });
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Motivo para Usuario 1'), 'Se encontró el ítem');
    await userEvent.click(confirm);

    await vi.waitFor(() => expect(body).toEqual({ reason: 'Se encontró el ítem' }));
  });

  it('el administrador reduce una sanción activa a una nueva duración total', async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/sanctions`, () => HttpResponse.json(page([sanction(1, 'ACTIVE')]))),
      http.post(`${API}/sanctions/1/reduce`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(sanction(1, 'ACTIVE'));
      }),
    );
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);

    await userEvent.click(await screen.findByRole('button', { name: 'Reducir' }));
    await userEvent.type(screen.getByLabelText('Nueva duración total en días para Usuario 1'), '7');
    await userEvent.type(screen.getByLabelText('Motivo para Usuario 1'), 'Primera falta');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reducción' }));

    await vi.waitFor(() => expect(body).toEqual({ days: 7, reason: 'Primera falta' }));
  });

  it('un baneo solo se puede levantar, no reducir', async () => {
    server.use(
      http.get(`${API}/sanctions`, () =>
        HttpResponse.json(page([{ ...sanction(1, 'ACTIVE'), type: 'LOSS', causedBan: true }])),
      ),
    );
    loginAs('ADMIN');
    renderWithProviders(<SanctionsPage />);

    expect(await screen.findByText('Baneo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Levantar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reducir' })).not.toBeInTheDocument();
  });

  it('muestra el tipo, el nivel del daño y la nota del administrador', async () => {
    server.use(
      http.get(`${API}/sanctions`, () =>
        HttpResponse.json(
          page([
            {
              ...sanction(1, 'LIFTED'),
              type: 'DAMAGE',
              damageLevel: 'SEVERE',
              adminNote: 'Error de registro',
            },
            { ...sanction(2, 'ACTIVE'), type: 'NO_SHOW', loanId: null, reservationId: 9 },
          ]),
        ),
      ),
    );
    loginAs('MANAGER');
    renderWithProviders(<SanctionsPage />);

    expect(await screen.findByText(/Daño · Extremo/)).toBeInTheDocument();
    expect(screen.getByText('Nota del administrador: Error de registro')).toBeInTheDocument();
    expect(screen.getByText('Reserva no recogida')).toBeInTheDocument();
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
    expect(screen.queryByRole('button', { name: 'Levantar' })).not.toBeInTheDocument();
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
