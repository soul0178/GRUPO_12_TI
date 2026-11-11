import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from '@/features/users/components/UserForm';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('UserForm', () => {
  it('muestra errores de validación al crear con campos vacíos', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<UserForm mode="create" isSubmitting={false} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Los nombres son obligatorios')).toBeInTheDocument();
    expect(screen.getByText('Los apellidos son obligatorios')).toBeInTheDocument();
    expect(screen.getByText('El correo es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El código o DNI es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no pide contraseña al editar', () => {
    renderWithProviders(<UserForm mode="edit" isSubmitting={false} onSubmit={vi.fn()} />);

    expect(screen.queryByLabelText('Contraseña inicial')).not.toBeInTheDocument();
  });

  it('envía los datos válidos al crear', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<UserForm mode="create" isSubmitting={false} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Nombres'), 'Ana');
    await userEvent.type(screen.getByLabelText('Apellidos'), 'Pérez');
    await userEvent.type(screen.getByLabelText('Correo institucional'), 'ana@epcc.unsa.edu.pe');
    await userEvent.type(screen.getByLabelText('Código o DNI'), '20201234');
    await userEvent.type(screen.getByLabelText('Contraseña inicial'), 'Clave1234');
    await userEvent.selectOptions(screen.getByLabelText('Rol'), 'MANAGER');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      email: 'ana@epcc.unsa.edu.pe',
      role: 'MANAGER',
    });
  });

  it('deshabilita el botón mientras se envía', () => {
    renderWithProviders(<UserForm mode="create" isSubmitting onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
  });
});
