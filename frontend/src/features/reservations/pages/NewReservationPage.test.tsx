import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { NewReservationPage } from '@/features/reservations/pages/NewReservationPage';
import { reservationFixture } from '@/features/reservations/testFixtures';
import { server } from '@/test/mocks/server';
import { loginAs, renderRoutes } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const item = {
  id: 5,
  code: 'EQ-001',
  name: 'Laptop',
  description: null,
  category: { id: 1, name: 'Equipo', maxLoanHours: 4, requiresGuarantee: true },
  status: 'AVAILABLE',
  createdAt: '2026-03-01T10:00:00Z',
};

const itemsPage = { content: [item], page: 0, size: 8, totalElements: 1, totalPages: 1 };

const availability = (available: boolean) => ({
  itemId: 5,
  from: '',
  to: '',
  available,
  busyRanges: available
    ? []
    : [{ startAt: '2030-03-10T15:00:00Z', endAt: '2030-03-10T16:00:00Z', type: 'RESERVATION' }],
});

function renderPage() {
  loginAs('STUDENT');
  renderRoutes(
    [
      { path: '/reservations/new', element: <NewReservationPage /> },
      { path: '/reservations', element: <p>Lista de reservas</p> },
    ],
    '/reservations/new',
  );
}

async function pickItem() {
  await userEvent.click(await screen.findByRole('button', { name: /EQ-001/ }));
}

function fillRange(start: string, end: string) {
  fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: start } });
  fireEvent.change(screen.getByLabelText('Fin'), { target: { value: end } });
}

describe('NewReservationPage', () => {
  it('reserva en tres pasos: ítem, horario y confirmación', async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/items`, () => HttpResponse.json(itemsPage)),
      http.get(`${API}/items/5/availability`, () => HttpResponse.json(availability(true))),
      http.post(`${API}/reservations`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(reservationFixture(), { status: 201 });
      }),
    );
    renderPage();

    await pickItem();
    fillRange('2030-03-10T10:00', '2030-03-10T12:00');
    expect(await screen.findByText('El ítem está libre en ese horario.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(await screen.findByText('Lista de reservas')).toBeInTheDocument();
    expect(body).toEqual({
      itemId: 5,
      startAt: '2030-03-10T15:00:00.000Z',
      endAt: '2030-03-10T17:00:00.000Z',
    });
  });

  it('valida que el rango no supere el plazo de la categoría', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(itemsPage)));
    renderPage();

    await pickItem();
    fillRange('2030-03-10T10:00', '2030-03-10T18:00');

    expect(
      await screen.findByText('La reserva no puede durar más de 4 horas.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  it('valida que la reserva empiece en el futuro', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(itemsPage)));
    renderPage();

    await pickItem();
    fillRange('2020-03-10T10:00', '2020-03-10T11:00');

    expect(await screen.findByText('La reserva debe empezar en el futuro.')).toBeInTheDocument();
  });

  it('muestra los tramos ocupados y no deja continuar si el ítem no está libre', async () => {
    server.use(
      http.get(`${API}/items`, () => HttpResponse.json(itemsPage)),
      http.get(`${API}/items/5/availability`, () => HttpResponse.json(availability(false))),
    );
    renderPage();

    await pickItem();
    fillRange('2030-03-10T10:00', '2030-03-10T12:00');

    expect(
      await screen.findByText('El ítem no está disponible en ese horario.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Reservado:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  it('muestra el mensaje del servidor si la reserva se rechaza', async () => {
    server.use(
      http.get(`${API}/items`, () => HttpResponse.json(itemsPage)),
      http.get(`${API}/items/5/availability`, () => HttpResponse.json(availability(true))),
      http.post(`${API}/reservations`, () =>
        HttpResponse.json(
          { status: 409, detail: 'El ítem ya está reservado en ese horario' },
          { status: 409 },
        ),
      ),
    );
    renderPage();

    await pickItem();
    fillRange('2030-03-10T10:00', '2030-03-10T12:00');
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ya está reservado');
  });
});
