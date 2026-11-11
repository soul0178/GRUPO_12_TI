import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ReturnLoanPage } from '@/features/loans/pages/ReturnLoanPage';
import { loanFixture } from '@/features/loans/testFixtures';
import { server } from '@/test/mocks/server';
import { loginAs, renderRoutes } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

function renderPage() {
  loginAs('MANAGER');
  renderRoutes([{ path: '/loans/:id/return', element: <ReturnLoanPage /> }], '/loans/1/return');
}

describe('ReturnLoanPage', () => {
  it('registra una devolución en buen estado', async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/loans/1`, () => HttpResponse.json(loanFixture())),
      http.post(`${API}/loans/1/return`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          loanFixture({
            status: 'RETURNED',
            returnCondition: 'GOOD',
            returnedAt: '2026-03-10T17:00:00Z',
          }),
        );
      }),
    );
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Registrar devolución' }));

    expect(await screen.findByText(/Devolución registrada: EQ-001/)).toBeInTheDocument();
    expect(screen.getByText(/Devuelva al usuario su garantía/)).toBeInTheDocument();
    expect(screen.queryByText(/sanción por atraso/)).not.toBeInTheDocument();
    expect(body).toMatchObject({ returnCondition: 'GOOD' });
  });

  it('avisa del atraso y del posible daño tras devolver', async () => {
    server.use(
      http.get(`${API}/loans/1`, () => HttpResponse.json(loanFixture({ status: 'OVERDUE' }))),
      http.post(`${API}/loans/1/return`, () =>
        HttpResponse.json(loanFixture({ status: 'RETURNED', returnCondition: 'DAMAGED' })),
      ),
    );
    renderPage();
    expect(await screen.findByText(/está vencido/)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Estado físico al devolver'), 'DAMAGED');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar devolución' }));

    expect(await screen.findByText(/se aplicó una sanción por atraso/)).toBeInTheDocument();
    expect(screen.getByText(/posible daño/)).toBeInTheDocument();
    expect(screen.getByText(/fuera de servicio/)).toBeInTheDocument();
  });

  it('indica que el préstamo ya fue devuelto y no muestra el formulario', async () => {
    server.use(
      http.get(`${API}/loans/1`, () => HttpResponse.json(loanFixture({ status: 'RETURNED' }))),
    );
    renderPage();

    expect(await screen.findByText('Este préstamo ya fue devuelto.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar devolución' })).not.toBeInTheDocument();
  });

  it('muestra el error si el préstamo no existe', async () => {
    server.use(
      http.get(`${API}/loans/1`, () =>
        HttpResponse.json(
          { status: 404, detail: 'No existe el préstamo con id 1' },
          { status: 404 },
        ),
      ),
    );
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('No existe el préstamo con id 1');
  });
});
