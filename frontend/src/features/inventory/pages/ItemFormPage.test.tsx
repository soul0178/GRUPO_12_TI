import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { ItemFormPage } from '@/features/inventory/pages/ItemFormPage';
import { server } from '@/test/mocks/server';
import { loginAs, renderRoutes } from '@/test/renderWithProviders';

const API = 'http://localhost:8080/api';

const categories = [{ id: 1, name: 'Equipo', maxLoanHours: 4, requiresGuarantee: true }];

const routes = [
  { path: '/items/new', element: <ItemFormPage /> },
  { path: '/items/:id/edit', element: <ItemFormPage /> },
  { path: '/items', element: <p>Catálogo de ítems</p> },
];

const existingItem = (status: string) => ({
  id: 5,
  code: 'EQ-005',
  name: 'Proyector',
  description: 'Sala 3',
  category: categories[0],
  status,
  createdAt: '2026-03-10T15:30:00Z',
});

async function fillValidForm() {
  await userEvent.type(await screen.findByLabelText('Código de inventario'), 'EQ-010');
  await userEvent.type(screen.getByLabelText('Nombre'), 'Proyector');
  await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Equipo');
  await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
}

describe('ItemFormPage', () => {
  beforeEach(() => {
    loginAs('MANAGER');
    server.use(http.get(`${API}/categories`, () => HttpResponse.json(categories)));
  });

  it('crea el ítem y vuelve al catálogo', async () => {
    let body: unknown;
    server.use(
      http.post(`${API}/items`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(existingItem('AVAILABLE'), { status: 201 });
      }),
    );
    renderRoutes(routes, '/items/new');

    await fillValidForm();

    expect(await screen.findByText('Catálogo de ítems')).toBeInTheDocument();
    expect(body).toMatchObject({ code: 'EQ-010', name: 'Proyector', categoryId: 1 });
  });

  it('muestra el mensaje del backend si el código ya existe', async () => {
    server.use(
      http.post(`${API}/items`, () =>
        HttpResponse.json(
          { status: 409, detail: 'Ya existe un ítem con el código EQ-010' },
          { status: 409 },
        ),
      ),
    );
    renderRoutes(routes, '/items/new');

    await fillValidForm();

    expect(await screen.findByText('Ya existe un ítem con el código EQ-010')).toBeInTheDocument();
  });

  it('edita un ítem y envía el nuevo estado', async () => {
    let body: unknown;
    server.use(
      http.get(`${API}/items/5`, () => HttpResponse.json(existingItem('AVAILABLE'))),
      http.put(`${API}/items/5`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(existingItem('OUT_OF_SERVICE'));
      }),
    );
    renderRoutes(routes, '/items/5/edit');

    await userEvent.selectOptions(await screen.findByLabelText('Estado'), 'OUT_OF_SERVICE');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Catálogo de ítems')).toBeInTheDocument();
    expect(body).toMatchObject({ code: 'EQ-005', status: 'OUT_OF_SERVICE', categoryId: 1 });
  });

  it('no deja editar un ítem dado de baja', async () => {
    server.use(http.get(`${API}/items/5`, () => HttpResponse.json(existingItem('RETIRED'))));
    renderRoutes(routes, '/items/5/edit');

    expect(
      await screen.findByText('El ítem está dado de baja y no se puede modificar.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar' })).not.toBeInTheDocument();
  });
});
