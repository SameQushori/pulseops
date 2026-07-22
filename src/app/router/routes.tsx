import { Navigate, type RouteObject } from 'react-router-dom';

import { AppShell } from '../shell/AppShell';
import { RouteErrorBoundary, RouteLoading } from './RouteBoundary';

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    lazy: async () => {
      const { LandingPage } = await import('../../pages/landing/LandingPage');
      return { Component: LandingPage };
    },
    HydrateFallback: RouteLoading,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: '/app',
    element: <AppShell />,
    HydrateFallback: RouteLoading,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      {
        path: 'overview',
        lazy: async () => {
          const { OverviewPage } =
            await import('../../pages/overview/OverviewPage');
          return { Component: OverviewPage };
        },
      },
      {
        path: 'incidents',
        lazy: async () => {
          const { IncidentsPage } =
            await import('../../pages/incidents/IncidentsPage');
          return { Component: IncidentsPage };
        },
      },
      {
        path: 'incidents/:incidentId',
        lazy: async () => {
          const { IncidentDetailsPage } =
            await import('../../pages/incident-details/IncidentDetailsPage');
          return { Component: IncidentDetailsPage };
        },
      },
      {
        path: 'services',
        lazy: async () => {
          const { ServicesPage } =
            await import('../../pages/services/ServicesPage');
          return { Component: ServicesPage };
        },
      },
      {
        path: 'services/:serviceId',
        lazy: async () => {
          const { ServiceDetailsPage } =
            await import('../../pages/service-details/ServiceDetailsPage');
          return { Component: ServiceDetailsPage };
        },
      },
      {
        path: '*',
        lazy: async () => {
          const { NotFoundPage } =
            await import('../../pages/not-found/NotFoundPage');
          return { Component: () => <NotFoundPage withinApp /> };
        },
      },
    ],
  },
  {
    path: '*',
    lazy: async () => {
      const { NotFoundPage } =
        await import('../../pages/not-found/NotFoundPage');
      return { Component: NotFoundPage };
    },
    HydrateFallback: RouteLoading,
    ErrorBoundary: RouteErrorBoundary,
  },
];
