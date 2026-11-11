import { screen, within } from '@testing-library/react';
import { routes } from '@/app/router';
import { loginAs, renderRoutes } from '@/test/renderWithProviders';

describe('rutas de la aplicación', () => {
  it('muestra el layout con la navegación cuando hay sesión', () => {
    loginAs('ADMIN');

    renderRoutes(routes, '/');

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sistema de Préstamos EPCC' })).toBeInTheDocument();
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
  });

  it('redirige al login cuando no hay sesión', () => {
    renderRoutes(routes, '/');

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('muestra el enlace de usuarios solo al administrador', () => {
    loginAs('ADMIN');

    renderRoutes(routes, '/');

    expect(screen.getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
  });

  it('oculta el enlace de usuarios a un estudiante', () => {
    loginAs('STUDENT');

    renderRoutes(routes, '/');

    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(navigation).getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
  });

  it('muestra Catálogo a todos y Categorías solo al administrador', () => {
    loginAs('MANAGER');

    renderRoutes(routes, '/');

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(navigation).getByRole('link', { name: 'Catálogo' })).toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: 'Categorías' })).not.toBeInTheDocument();
  });

  it('muestra Reservas a un estudiante', () => {
    loginAs('STUDENT');

    renderRoutes(routes, '/');

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(navigation).getByRole('link', { name: 'Reservas' })).toBeInTheDocument();
  });

  it('muestra Préstamos al encargado y lo oculta a un estudiante', () => {
    loginAs('MANAGER');
    const { unmount } = renderRoutes(routes, '/');
    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(navigation).getByRole('link', { name: 'Préstamos' })).toBeInTheDocument();
    unmount();

    loginAs('STUDENT');
    renderRoutes(routes, '/');

    expect(screen.queryByRole('link', { name: 'Préstamos' })).not.toBeInTheDocument();
  });

  it('muestra Sanciones al encargado y Políticas solo al administrador', () => {
    loginAs('MANAGER');

    renderRoutes(routes, '/');

    const navigation = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(navigation).getByRole('link', { name: 'Sanciones' })).toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: 'Políticas' })).not.toBeInTheDocument();
  });

  it.each(['/categories', '/settings', '/sanctions', '/items/new', '/items/3/edit'])(
    'envía a "sin permiso" al estudiante que entra a %s',
    (path) => {
      loginAs('STUDENT');

      renderRoutes(routes, path);

      expect(screen.getByRole('heading', { name: 'Sin permiso' })).toBeInTheDocument();
    },
  );

  it('envía a "sin permiso" al estudiante que entra a /users', () => {
    loginAs('STUDENT');

    renderRoutes(routes, '/users');

    expect(screen.getByRole('heading', { name: 'Sin permiso' })).toBeInTheDocument();
  });

  it('muestra la página de ruta inexistente', () => {
    renderRoutes(routes, '/no-existe');

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
  });
});
