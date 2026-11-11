import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MyReservationsPage } from '@/features/reservations/pages/MyReservationsPage';
import { reservationFixture } from '@/features/reservations/testFixtures';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const page = (content: unknown[]) => ({
  content,
  page: 0,
  size: 10,
  totalElements: content.length,
  totalPages: 1,
});

describe('MyReservationsPage', () => {
  it('muestra la carga y luego las reservas con su estado', async () => {
    server.use(
      http.get(`${API}/me/reservations`, () =>
        HttpResponse.json(
          page([reservationFixture({ id: 1 }), reservationFixture({ id: 2, status: 'EXPIRED' })]),
        ),
      ),
    );
    loginAs('STUDENT');
    renderWithProviders(<MyReservationsPage />);

    expect(screen.getByText('Cargando reservas...')).toBeInTheDocument();
    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Expirada')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Cancelar reserva/ })).toHaveLength(1);
  });

  it('muestra un mensaje cuando no hay reservas', async () => {
    server.use(http.get(`${API}/me/reservations`, () => HttpResponse.json(page([]))));
    loginAs('STUDENT');
    renderWithProviders(<MyReservationsPage />);

    expect(await screen.findByText('Aún no tiene reservas.')).toBeInTheDocument();
  });

  it('muestra el error del servidor', async () => {
    server.use(
      http.get(`${API}/me/reservations`, () =>
        HttpResponse.json({ status: 500, detail: 'Error inesperado' }, { status: 500 }),
      ),
    );
    loginAs('STUDENT');
    renderWithProviders(<MyReservationsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Error inesperado');
  });

  it('cancela una reserva pendiente y recarga la lista', async () => {
    let cancelled = false;
    server.use(
      http.get(`${API}/me/reservations`, () =>
        HttpResponse.json(
          page([reservationFixture({ status: cancelled ? 'CANCELLED' : 'PENDING' })]),
        ),
      ),
      http.post(`${API}/reservations/1/cancel`, () => {
        cancelled = true;
        return HttpResponse.json(reservationFixture({ status: 'CANCELLED' }));
      }),
    );
    loginAs('STUDENT');
    renderWithProviders(<MyReservationsPage />);

    await userEvent.click(
      await screen.findByRole('button', { name: /Cancelar reserva de EQ-001/ }),
    );

    expect(await screen.findByText('Cancelada')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cancelar reserva/ })).not.toBeInTheDocument();
  });
});
