import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { ForbiddenPage } from '@/app/pages/ForbiddenPage';
import { HomePage } from '@/app/pages/HomePage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { CatalogPage } from '@/features/inventory/pages/CatalogPage';
import { CategoriesPage } from '@/features/inventory/pages/CategoriesPage';
import { ItemFormPage } from '@/features/inventory/pages/ItemFormPage';
import { LoanListPage } from '@/features/loans/pages/LoanListPage';
import { NewLoanPage } from '@/features/loans/pages/NewLoanPage';
import { ReturnLoanPage } from '@/features/loans/pages/ReturnLoanPage';
import { MyReservationsPage } from '@/features/reservations/pages/MyReservationsPage';
import { NewReservationPage } from '@/features/reservations/pages/NewReservationPage';
import { PolicySettingsPage } from '@/features/sanctions/pages/PolicySettingsPage';
import { SanctionsPage } from '@/features/sanctions/pages/SanctionsPage';
import { ProfilePage } from '@/features/users/pages/ProfilePage';
import { UserFormPage } from '@/features/users/pages/UserFormPage';
import { UserListPage } from '@/features/users/pages/UserListPage';

/**
 * Rutas de la aplicación. Las que están dentro de ProtectedRoute exigen sesión;
 * para limitar una ruta a ciertos roles se usa `<ProtectedRoute roles={['ADMIN']} />`.
 */
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/items', element: <CatalogPage /> },
          { path: '/reservations', element: <MyReservationsPage /> },
          { path: '/reservations/new', element: <NewReservationPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/sin-permiso', element: <ForbiddenPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['MANAGER', 'ADMIN']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/items/new', element: <ItemFormPage /> },
          { path: '/items/:id/edit', element: <ItemFormPage /> },
          { path: '/loans', element: <LoanListPage /> },
          { path: '/loans/new', element: <NewLoanPage /> },
          { path: '/loans/:id/return', element: <ReturnLoanPage /> },
          { path: '/sanctions', element: <SanctionsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['ADMIN']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/categories', element: <CategoriesPage /> },
          { path: '/settings', element: <PolicySettingsPage /> },
          { path: '/users', element: <UserListPage /> },
          { path: '/users/new', element: <UserFormPage /> },
          { path: '/users/:id/edit', element: <UserFormPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];
