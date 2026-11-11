import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { PolicySettingsPage } from '@/features/sanctions/pages/PolicySettingsPage';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

describe('PolicySettingsPage', () => {
  beforeEach(() => {
    loginAs('ADMIN');
    server.use(
      http.get(`${API}/settings`, () =>
        HttpResponse.json({ maxActiveItems: 3, reservationExpirationMinutes: 30 }),
      ),
    );
  });

  it('muestra los valores vigentes', async () => {
    renderWithProviders(<PolicySettingsPage />);

    expect(await screen.findByLabelText('Máximo de préstamos y reservas por usuario')).toHaveValue(
      3,
    );
    expect(screen.getByLabelText('Minutos para recoger una reserva')).toHaveValue(30);
  });

  it('guarda los nuevos valores', async () => {
    let body: unknown;
    server.use(
      http.put(`${API}/settings`, async ({ request }) => {
        const received = (await request.json()) as Record<string, number>;
        body = received;
        return HttpResponse.json(received);
      }),
    );
    renderWithProviders(<PolicySettingsPage />);
    const minutes = await screen.findByLabelText('Minutos para recoger una reserva');

    await userEvent.clear(minutes);
    await userEvent.type(minutes, '45');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Políticas actualizadas')).toBeInTheDocument();
    expect(body).toEqual({ maxActiveItems: 3, reservationExpirationMinutes: 45 });
  });

  it('valida que los valores sean positivos', async () => {
    renderWithProviders(<PolicySettingsPage />);
    const max = await screen.findByLabelText('Máximo de préstamos y reservas por usuario');

    await userEvent.clear(max);
    await userEvent.type(max, '0');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('El máximo debe ser al menos 1')).toBeInTheDocument();
  });

  it('muestra el error del backend al guardar', async () => {
    server.use(
      http.put(`${API}/settings`, () =>
        HttpResponse.json(
          { status: 403, detail: 'No tiene permiso para realizar esta acción' },
          { status: 403 },
        ),
      ),
    );
    renderWithProviders(<PolicySettingsPage />);
    await screen.findByLabelText('Minutos para recoger una reserva');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText('No tiene permiso para realizar esta acción'),
    ).toBeInTheDocument();
  });
});
