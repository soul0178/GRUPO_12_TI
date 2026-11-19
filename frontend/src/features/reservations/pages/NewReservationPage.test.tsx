import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { pageOf } from '@/features/loans/testFixtures';
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
    : [{ startAt: '2030-03-11T15:00:00Z', endAt: '2030-03-11T16:00:00Z', type: 'RESERVATION' }],
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
    fillRange('2030-03-11T10:00', '2030-03-11T12:00');
    expect(await screen.findByText('El ítem está libre en ese horario.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(await screen.findByText('Lista de reservas')).toBeInTheDocument();
    expect(body).toEqual({
      itemId: 5,
      startAt: '2030-03-11T15:00:00.000Z',
      endAt: '2030-03-11T17:00:00.000Z',
    });
  });

  it('valida que el rango no supere el plazo de la categoría', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(itemsPage)));
    renderPage();

    await pickItem();
    fillRange('2030-03-11T10:00', '2030-03-11T18:00');

    expect(
      await screen.findByText('La reserva no puede durar más de 4 horas.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  it('no deja reservar en domingo', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(itemsPage)));
    renderPage();

    await pickItem();
    fillRange('2030-03-10T10:00', '2030-03-10T12:00');

    expect(
      await screen.findByText('No se pueden hacer reservas los domingos.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  });

  it('muestra los niveles de daño con ejemplos y las sanciones antes de reservar', () => {
    renderPage();

    const notice = screen.getByRole('region', { name: 'Política de daños y sanciones' });
    expect(notice).toHaveTextContent('qué se considera un ítem dañado');
    expect(notice).toHaveTextContent('Leve (3 días)');
    expect(notice).toHaveTextContent('Moderado (15 días)');
    expect(notice).toHaveTextContent('Extremo (60 días)');
    expect(notice).toHaveTextContent('Pérdida (90 días, falta grave)');
    expect(notice).toHaveTextContent('pantalla rota');
    expect(notice).toHaveTextContent('baneado');
  });

  it('lista todos los ítems (equipos, libros y objetos) desde el inicio, sin escribir nada', async () => {
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
    renderPage();

    expect(await screen.findByRole('button', { name: /LB-001 · Cormen/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OB-001 · Puntero/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar ítem')).toHaveValue('');
    expect(sizes.every((size) => Number(size) >= 20)).toBe(true);
  });

  it('no deja reservar fuera del horario de atención', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(itemsPage)));
    renderPage();

    await pickItem();
    fillRange('2030-03-11T19:00', '2030-03-11T21:00');

    expect(
      await screen.findByText(/horario de atención \(07:00 a 20:10\)/),
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
    fillRange('2030-03-11T10:00', '2030-03-11T12:00');

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
    fillRange('2030-03-11T10:00', '2030-03-11T12:00');
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar reserva' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ya está reservado');
  });
});
