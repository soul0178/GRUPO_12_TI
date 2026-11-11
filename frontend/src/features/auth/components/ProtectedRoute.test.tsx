import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { useAuthStore } from '@/features/auth/store/authStore';

function renderAdminRoute() {
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<p>Zona de administración</p>} />
        </Route>
        <Route path="/sin-permiso" element={<p>Sin permiso</p>} />
        <Route path="/login" element={<p>Login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('permite el paso a un usuario con el rol requerido', () => {
    useAuthStore.getState().setSession('t', {
      id: 1,
      firstName: 'A',
      lastName: 'B',
      email: 'test@epcc.unsa.edu.pe',
      role: 'ADMIN',
    });

    renderAdminRoute();

    expect(screen.getByText('Zona de administración')).toBeInTheDocument();
  });

  it('envía a "sin permiso" a un usuario con otro rol', () => {
    useAuthStore.getState().setSession('t', {
      id: 2,
      firstName: 'C',
      lastName: 'D',
      email: 'test@epcc.unsa.edu.pe',
      role: 'STUDENT',
    });

    renderAdminRoute();

    expect(screen.getByText('Sin permiso')).toBeInTheDocument();
  });

  it('envía al login si no hay sesión', () => {
    renderAdminRoute();

    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
