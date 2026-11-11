import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemForm } from '@/features/inventory/components/ItemForm';
import { renderWithProviders } from '@/test/renderWithProviders';

const categories = [
  { id: 1, name: 'Equipo', maxLoanHours: 4, requiresGuarantee: true },
  { id: 2, name: 'Libro', maxLoanHours: 72, requiresGuarantee: false },
];

describe('ItemForm', () => {
  it('muestra errores de validación al crear con campos vacíos', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ItemForm mode="create" categories={categories} isSubmitting={false} onSubmit={onSubmit} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('El código de inventario es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La categoría es obligatoria')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos válidos', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ItemForm mode="create" categories={categories} isSubmitting={false} onSubmit={onSubmit} />,
    );

    await userEvent.type(screen.getByLabelText('Código de inventario'), 'EQ-010');
    await userEvent.type(screen.getByLabelText('Nombre'), 'Proyector');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), 'Equipo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      code: 'EQ-010',
      name: 'Proyector',
      categoryId: '1',
    });
  });

  it('solo ofrece estado al editar, con Disponible y Fuera de servicio', () => {
    renderWithProviders(
      <ItemForm mode="edit" categories={categories} isSubmitting={false} onSubmit={vi.fn()} />,
    );

    const options = screen.getAllByRole('option', { name: /Disponible|Fuera de servicio/ });
    expect(options).toHaveLength(2);
  });

  it('no permite editar el estado de un ítem prestado', () => {
    renderWithProviders(
      <ItemForm
        mode="edit"
        categories={categories}
        lockedStatus="ON_LOAN"
        isSubmitting={false}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Estado')).not.toBeInTheDocument();
    expect(screen.getByText(/Prestado \(no se puede cambiar manualmente\)/)).toBeInTheDocument();
  });

  it('no muestra el estado al crear', () => {
    renderWithProviders(
      <ItemForm mode="create" categories={categories} isSubmitting={false} onSubmit={vi.fn()} />,
    );

    expect(screen.queryByLabelText('Estado')).not.toBeInTheDocument();
  });
});
