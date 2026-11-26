import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { NewLoanPage } from '@/features/loans/pages/NewLoanPage';
import { loanFixture, pageOf } from '@/features/loans/testFixtures';
import { server } from '@/test/mocks/server';
import { reservationFixture } from '@/features/reservations/testFixtures';
import { loginAs, renderRoutes, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const student = {
  id: 20,
  firstName: 'Luis',
  lastName: 'Quispe',
  email: 'luis@epcc.unsa.edu.pe',
  documentNumber: '70123456',
  role: 'STUDENT',
  active: true,
};

const category = (requiresGuarantee: boolean) => ({
  id: 1,
  name: requiresGuarantee ? 'Equipo' : 'Libro',
  maxLoanHours: requiresGuarantee ? 4 : 72,
  requiresGuarantee,
});

const item = (requiresGuarantee: boolean) => ({
  id: 5,
  code: requiresGuarantee ? 'EQ-001' : 'LB-001',
  name: requiresGuarantee ? 'Laptop' : 'Clean Code',
  description: null,
  category: category(requiresGuarantee),
  status: 'AVAILABLE',
  createdAt: '2026-03-01T10:00:00Z',
});

function mockSearches(requiresGuarantee: boolean) {
  server.use(
    http.get(`${API}/users/lookup`, () => HttpResponse.json([student])),
    http.get(`${API}/items`, () => HttpResponse.json(pageOf([item(requiresGuarantee)]))),
  );
}

async function pickUserAndItem(itemLabel: string) {
  await userEvent.type(screen.getByLabelText('Buscar usuario'), 'luis');
  await userEvent.click(await screen.findByRole('button', { name: /Luis Quispe/ }));
  await userEvent.click(await screen.findByRole('button', { name: new RegExp(itemLabel) }));
}

describe('NewLoanPage', () => {
  it('registra la entrega de un libro sin garantía', async () => {
    mockSearches(false);
    let body: unknown;
    server.use(
      http.post(`${API}/loans`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(loanFixture({ itemCode: 'LB-001', guarantee: null }), {
          status: 201,
        });
      }),
    );
    loginAs('MANAGER');
    renderWithProviders(<NewLoanPage />);

    await pickUserAndItem('LB-001');
    expect(screen.queryByLabelText('Descripción de la garantía')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Registrar entrega' }));

    expect(await screen.findByText(/LB-001 entregado a Luis Quispe/)).toBeInTheDocument();
    expect(body).toMatchObject({ userId: 20, itemId: 5, deliveryCondition: 'GOOD' });
    expect(body).not.toHaveProperty('guarantee');
  });

  it('exige la descripción de la garantía cuando la categoría la pide', async () => {
    mockSearches(true);
    loginAs('MANAGER');
    renderWithProviders(<NewLoanPage />);

    await pickUserAndItem('EQ-001');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar entrega' }));

    expect(
      await screen.findByText('La descripción de la garantía es obligatoria'),
    ).toBeInTheDocument();
  });

  it('envía la garantía y muestra el mensaje del servidor si rechaza la entrega', async () => {
    mockSearches(true);
    let body: unknown;
    server.use(
      http.post(`${API}/loans`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          {
            status: 409,
            detail: 'El usuario tiene una sanción activa y no puede recibir préstamos',
          },
          { status: 409 },
        );
      }),
    );
    loginAs('MANAGER');
    renderWithProviders(<NewLoanPage />);

    await pickUserAndItem('EQ-001');
    await userEvent.type(screen.getByLabelText('Descripción de la garantía'), 'DNI 70123456');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar entrega' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('sanción activa');
    await waitFor(() =>
      expect(body).toMatchObject({ guarantee: { type: 'DNI', description: 'DNI 70123456' } }),
    );
  });

  it('muestra un aviso cuando la búsqueda de usuarios no encuentra nada', async () => {
    server.use(http.get(`${API}/users/lookup`, () => HttpResponse.json([])));
    loginAs('MANAGER');
    renderWithProviders(<NewLoanPage />);

    await userEvent.type(screen.getByLabelText('Buscar usuario'), 'zzz');

    expect(await screen.findByText('No se encontraron usuarios.')).toBeInTheDocument();
  });

  describe('desde una reserva', () => {
    const reservation = reservationFixture({
      userId: 20,
      userFullName: 'Luis Quispe',
      userEmail: 'luis@epcc.unsa.edu.pe',
      itemId: 5,
      itemCode: 'EQ-001',
    });

    function renderFromReservation() {
      return renderRoutes([{ path: '/loans/new', element: <NewLoanPage /> }], {
        pathname: '/loans/new',
        state: { reservation },
      });
    }

    function mockPrefill() {
      server.use(
        http.get(`${API}/items/5`, () => HttpResponse.json(item(true))),
        http.get(`${API}/users/lookup`, () => HttpResponse.json([student])),
      );
    }

    it('precarga el usuario y el ítem de la reserva', async () => {
      mockPrefill();
      loginAs('MANAGER');
      renderFromReservation();

      expect(await screen.findByText('EQ-001 · Laptop')).toBeInTheDocument();
      expect(await screen.findByText('Luis Quispe')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Entrega de la reserva de Luis Quispe');
      expect(await screen.findByRole('button', { name: 'Registrar entrega' })).toBeInTheDocument();
    });

    it('entrega con los datos de la reserva', async () => {
      mockPrefill();
      let body: unknown;
      server.use(
        http.post(`${API}/loans`, async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(loanFixture(), { status: 201 });
        }),
      );
      loginAs('MANAGER');
      renderFromReservation();

      await screen.findByText('Luis Quispe');
      await userEvent.type(
        await screen.findByLabelText(/Descripción de la garantía/),
        'DNI 70123456',
      );
      await userEvent.click(await screen.findByRole('button', { name: 'Registrar entrega' }));

      await waitFor(() => expect(body).toMatchObject({ userId: 20, itemId: 5 }));
      expect(await screen.findByText('Entrega registrada')).toBeInTheDocument();
    });

    it('no permite cambiar el usuario ni el ítem de la reserva', async () => {
      mockPrefill();
      loginAs('MANAGER');
      renderFromReservation();

      expect(await screen.findByText('Luis Quispe')).toBeInTheDocument();
      expect(await screen.findByText('EQ-001 · Laptop')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cambiar usuario' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Cambiar ítem' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Buscar usuario')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Buscar ítem/)).not.toBeInTheDocument();
    });

    it('sin reserva, la pantalla empieza vacía como siempre', () => {
      loginAs('MANAGER');
      renderWithProviders(<NewLoanPage />);

      expect(screen.getByLabelText('Buscar usuario')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
