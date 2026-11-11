import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CatalogPage } from '@/features/inventory/pages/CatalogPage';
import { server } from '@/test/mocks/server';
import { loginAs, renderWithProviders } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const categories = [
  { id: 1, name: 'Equipo', maxLoanHours: 4, requiresGuarantee: true },
  { id: 2, name: 'Libro', maxLoanHours: 72, requiresGuarantee: false },
];

const item = (id: number, status = 'AVAILABLE') => ({
  id,
  code: `EQ-00${id}`,
  name: `Laptop ${id}`,
  description: null,
  category: categories[0],
  status,
  createdAt: '2026-03-10T15:30:00Z',
});

const page = (content: unknown[]) => ({
  content,
  page: 0,
  size: 10,
  totalElements: content.length,
  totalPages: 1,
});

describe('CatalogPage', () => {
  beforeEach(() => {
    server.use(http.get(`${API}/categories`, () => HttpResponse.json(categories)));
  });

  it('muestra la carga y luego los ítems', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(page([item(1), item(2)]))));
    loginAs('STUDENT');
    renderWithProviders(<CatalogPage />);

    expect(screen.getByText('Cargando catálogo...')).toBeInTheDocument();
    expect(await screen.findByText('Laptop 1')).toBeInTheDocument();
    expect(screen.getByText('EQ-002')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay resultados', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(page([]))));
    loginAs('STUDENT');
    renderWithProviders(<CatalogPage />);

    expect(await screen.findByText('No se encontraron ítems.')).toBeInTheDocument();
  });

  it('muestra el error del backend', async () => {
    server.use(
      http.get(`${API}/items`, () =>
        HttpResponse.json({ status: 500, detail: 'Ocurrió un error inesperado' }, { status: 500 }),
      ),
    );
    loginAs('STUDENT');
    renderWithProviders(<CatalogPage />);

    expect(await screen.findByText('Ocurrió un error inesperado')).toBeInTheDocument();
  });

  it('un prestatario solo consulta: no ve acciones de gestión', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(page([item(1)]))));
    loginAs('STUDENT');
    renderWithProviders(<CatalogPage />);
    await screen.findByText('Laptop 1');

    expect(screen.queryByRole('link', { name: 'Nuevo ítem' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dar de baja' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('envía los filtros de búsqueda, categoría y estado al backend', async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/items`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(page([item(1)]));
      }),
    );
    loginAs('STUDENT');
    renderWithProviders(<CatalogPage />);
    await screen.findByText('Laptop 1');

    await userEvent.type(screen.getByLabelText('Buscar'), 'laptop');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Equipo');
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'AVAILABLE');

    await screen.findByText('Laptop 1');
    await vi.waitFor(() => {
      const last = new URL(urls[urls.length - 1]).searchParams;
      expect(last.get('text')).toBe('laptop');
      expect(last.get('categoryId')).toBe('1');
      expect(last.get('status')).toBe('AVAILABLE');
    });
  });

  it('el personal da de baja un ítem tras confirmar', async () => {
    let retired = false;
    server.use(
      http.get(`${API}/items`, () =>
        HttpResponse.json(page([item(1, retired ? 'RETIRED' : 'AVAILABLE')])),
      ),
      http.post(`${API}/items/1/retire`, () => {
        retired = true;
        return HttpResponse.json(item(1, 'RETIRED'));
      }),
    );
    loginAs('MANAGER');
    renderWithProviders(<CatalogPage />);
    await screen.findByText('Laptop 1');

    await userEvent.click(screen.getByRole('button', { name: 'Dar de baja' }));
    expect(screen.getByText(/¿Dar de baja el ítem EQ-001/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar baja' }));

    const row = (await screen.findByText('De baja', { selector: 'span' })).closest(
      'tr',
    ) as HTMLElement;
    expect(within(row).queryByRole('button', { name: 'Dar de baja' })).not.toBeInTheDocument();
  });

  it('muestra el mensaje del backend si no se puede dar de baja', async () => {
    server.use(
      http.get(`${API}/items`, () => HttpResponse.json(page([item(1)]))),
      http.post(`${API}/items/1/retire`, () =>
        HttpResponse.json(
          { status: 409, detail: 'No se puede dar de baja un ítem con préstamo activo' },
          { status: 409 },
        ),
      ),
    );
    loginAs('ADMIN');
    renderWithProviders(<CatalogPage />);
    await screen.findByText('Laptop 1');

    await userEvent.click(screen.getByRole('button', { name: 'Dar de baja' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar baja' }));

    expect(
      await screen.findByText('No se puede dar de baja un ítem con préstamo activo'),
    ).toBeInTheDocument();
  });

  it('el personal ve el botón Nuevo ítem', async () => {
    server.use(http.get(`${API}/items`, () => HttpResponse.json(page([]))));
    loginAs('MANAGER');
    renderWithProviders(<CatalogPage />);

    expect(await screen.findByRole('link', { name: 'Nuevo ítem' })).toBeInTheDocument();
  });
});
