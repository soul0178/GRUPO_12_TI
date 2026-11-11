import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CategoriesPage } from '@/features/inventory/pages/CategoriesPage';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const categories = [
  { id: 1, name: 'Equipo', maxLoanHours: 4, requiresGuarantee: true },
  { id: 2, name: 'Libro', maxLoanHours: 72, requiresGuarantee: false },
];

describe('CategoriesPage', () => {
  beforeEach(() => {
    loginAs('ADMIN');
    server.use(http.get(`${API}/categories`, () => HttpResponse.json(categories)));
  });

  it('muestra las categorías con su plazo en horas y días', async () => {
    renderWithProviders(<CategoriesPage />);

    expect(await screen.findByLabelText('Plazo máximo en horas de Libro')).toHaveValue(72);
    expect(screen.getByText('72 horas (3 días)')).toBeInTheDocument();
    expect(screen.getByLabelText('Requiere garantía en Equipo')).toBeChecked();
  });

  it('guarda los cambios de una categoría', async () => {
    let body: unknown;
    server.use(
      http.put(`${API}/categories/2`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...categories[1], maxLoanHours: 48, requiresGuarantee: true });
      }),
    );
    renderWithProviders(<CategoriesPage />);
    const hours = await screen.findByLabelText('Plazo máximo en horas de Libro');

    await userEvent.clear(hours);
    await userEvent.type(hours, '48');
    await userEvent.click(screen.getByLabelText('Requiere garantía en Libro'));
    await userEvent.click(screen.getAllByRole('button', { name: 'Guardar' })[1]);

    expect(await screen.findByText('Categoría Libro actualizada')).toBeInTheDocument();
    expect(body).toEqual({ maxLoanHours: 48, requiresGuarantee: true });
  });

  it('valida que el plazo sea de al menos 1 hora', async () => {
    renderWithProviders(<CategoriesPage />);
    const hours = await screen.findByLabelText('Plazo máximo en horas de Equipo');

    await userEvent.clear(hours);
    await userEvent.type(hours, '0');
    await userEvent.click(screen.getAllByRole('button', { name: 'Guardar' })[0]);

    expect(await screen.findByText('El plazo debe ser de al menos 1 hora')).toBeInTheDocument();
  });
});
