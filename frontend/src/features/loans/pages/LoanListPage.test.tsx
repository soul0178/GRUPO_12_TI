import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { LoanListPage } from '@/features/loans/pages/LoanListPage';
import { loanFixture, pageOf } from '@/features/loans/testFixtures';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

describe('LoanListPage', () => {
  it('muestra la carga y luego los préstamos con su estado', async () => {
    server.use(
      http.get(`${API}/loans`, () =>
        HttpResponse.json(
          pageOf([loanFixture({ id: 1 }), loanFixture({ id: 2, status: 'OVERDUE' })]),
        ),
      ),
    );
    loginAs('MANAGER');
    renderWithProviders(<LoanListPage />);

    expect(screen.getByText('Cargando préstamos...')).toBeInTheDocument();
    expect(await screen.findAllByText('EQ-001')).toHaveLength(2);
    expect(screen.getByText('Activo', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Vencido', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Registrar devolución de EQ-001/ })).toHaveLength(2);
  });

  it('no ofrece devolver un préstamo ya devuelto', async () => {
    server.use(
      http.get(`${API}/loans`, () =>
        HttpResponse.json(pageOf([loanFixture({ status: 'RETURNED' })])),
      ),
    );
    loginAs('MANAGER');
    renderWithProviders(<LoanListPage />);

    expect(await screen.findByText('Devuelto', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Registrar devolución/ })).not.toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay préstamos', async () => {
    server.use(http.get(`${API}/loans`, () => HttpResponse.json(pageOf([]))));
    loginAs('MANAGER');
    renderWithProviders(<LoanListPage />);

    expect(await screen.findByText('No hay préstamos para mostrar.')).toBeInTheDocument();
  });

  it('muestra el error del servidor', async () => {
    server.use(
      http.get(`${API}/loans`, () =>
        HttpResponse.json({ status: 500, detail: 'Error inesperado' }, { status: 500 }),
      ),
    );
    loginAs('MANAGER');
    renderWithProviders(<LoanListPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Error inesperado');
  });

  it('filtra por estado enviando el parámetro al servidor', async () => {
    const statuses: (string | null)[] = [];
    server.use(
      http.get(`${API}/loans`, ({ request }) => {
        statuses.push(new URL(request.url).searchParams.get('status'));
        return HttpResponse.json(pageOf([]));
      }),
    );
    loginAs('MANAGER');
    renderWithProviders(<LoanListPage />);
    await screen.findByText('No hay préstamos para mostrar.');

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'OVERDUE');

    await screen.findByText('No hay préstamos para mostrar.');
    expect(statuses).toEqual([null, 'OVERDUE']);
  });
});
