import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { pageOf } from '@/features/loans/testFixtures';
import { StaffReservationsPage } from '@/features/reservations/pages/StaffReservationsPage';
import { reservationFixture } from '@/features/reservations/testFixtures';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

describe('StaffReservationsPage', () => {
  it('lista por defecto las reservas pendientes, las más próximas primero', async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/reservations`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(
          pageOf([
            reservationFixture({ id: 1, userFullName: 'Luis Quispe', itemCode: 'EQ-001' }),
            reservationFixture({ id: 2, userFullName: 'María Torres', itemCode: 'LB-002' }),
          ]),
        );
      }),
    );
    loginAs('MANAGER');
    renderWithProviders(<StaffReservationsPage />);

    expect(screen.getByText('Cargando reservas...')).toBeInTheDocument();
    expect(await screen.findByText('Luis Quispe')).toBeInTheDocument();
    expect(screen.getByText('María Torres')).toBeInTheDocument();
    const params = new URL(urls[0] as string).searchParams;
    expect(params.get('status')).toBe('PENDING');
    expect(params.get('sort')).toBe('startAt,asc');
  });

  it('ofrece Entregar solo en las reservas pendientes', async () => {
    server.use(
      http.get(`${API}/reservations`, () =>
        HttpResponse.json(
          pageOf([
            reservationFixture({ id: 1, itemCode: 'EQ-001', status: 'PENDING' }),
            reservationFixture({ id: 2, itemCode: 'EQ-002', status: 'FULFILLED' }),
            reservationFixture({ id: 3, itemCode: 'EQ-003', status: 'EXPIRED' }),
          ]),
        ),
      ),
    );
    loginAs('ADMIN');
    renderWithProviders(<StaffReservationsPage />);

    expect(await screen.findAllByRole('link', { name: /^Entregar / })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Entregar EQ-001/ })).toHaveAttribute(
      'href',
      '/loans/new',
    );
    const table = screen.getByRole('table');
    expect(within(table).getByText('Cumplida')).toBeInTheDocument();
    expect(within(table).getByText('Expirada')).toBeInTheDocument();
  });

  it('cambia el estado y el orden al filtrar', async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/reservations`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(pageOf([reservationFixture()]));
      }),
    );
    loginAs('MANAGER');
    renderWithProviders(<StaffReservationsPage />);
    await screen.findByText('Ana Pérez');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'EXPIRED');
    await screen.findByText('Ana Pérez');
    const expired = new URL(urls[urls.length - 1] as string).searchParams;
    expect(expired.get('status')).toBe('EXPIRED');
    expect(expired.get('sort')).toBe('startAt,desc');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), '');
    await screen.findByText('Ana Pérez');
    const all = new URL(urls[urls.length - 1] as string).searchParams;
    expect(all.get('status')).toBeNull();
  });

  it('muestra un mensaje cuando no hay reservas', async () => {
    server.use(http.get(`${API}/reservations`, () => HttpResponse.json(pageOf([]))));
    loginAs('MANAGER');
    renderWithProviders(<StaffReservationsPage />);

    expect(await screen.findByText('No hay reservas para mostrar.')).toBeInTheDocument();
  });

  it('muestra el error del servidor', async () => {
    server.use(
      http.get(`${API}/reservations`, () =>
        HttpResponse.json({ status: 500, detail: 'Error inesperado' }, { status: 500 }),
      ),
    );
    loginAs('MANAGER');
    renderWithProviders(<StaffReservationsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Error inesperado');
  });

  it('muestra las pestañas Mis reservas y Todas las reservas', async () => {
    server.use(http.get(`${API}/reservations`, () => HttpResponse.json(pageOf([]))));
    loginAs('MANAGER');
    renderWithProviders(<StaffReservationsPage />);

    expect(screen.getByRole('link', { name: 'Mis reservas' })).toHaveAttribute(
      'href',
      '/reservations',
    );
    expect(screen.getByRole('link', { name: 'Todas las reservas' })).toBeInTheDocument();
    await screen.findByText('No hay reservas para mostrar.');
  });
});
