import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { routes } from '@/app/router';

const router = createBrowserRouter(routes);

/** Raíz de la aplicación: proveedores globales y enrutador. */
export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
