import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { Role, SessionUser } from '@/features/auth/types/auth';

/** Inicia una sesión de prueba con el rol indicado. */
export function loginAs(role: Role, overrides: Partial<SessionUser> = {}) {
  useAuthStore.getState().setSession('token-de-prueba', {
    id: 1,
    firstName: 'Ana',
    lastName: 'Pérez',
    email: 'ana@epcc.unsa.edu.pe',
    role,
    ...overrides,
  });
}

/** Renderiza un elemento con TanStack Query (sin reintentos) y un enrutador en memoria. */
export function renderWithProviders(ui: ReactElement, path = '/') {
  return renderRoutes([{ path: '*', element: ui }], path);
}

/** Renderiza un conjunto de rutas en memoria, empezando en `path`. */
export function renderRoutes(routes: RouteObject[], path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
