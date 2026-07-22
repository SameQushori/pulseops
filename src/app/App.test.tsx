import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { appRoutes } from './router/routes';
import { AppProviders } from './providers/AppProviders';
import { createAppStore } from './store/store';

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <AppProviders store={createAppStore()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

describe('application routes', () => {
  it('renders the public route outside the application shell', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderRoute('/');

    expect(
      await screen.findByRole(
        'heading',
        {
          level: 1,
          name: 'See an incident unfold. Resolve it before users notice.',
        },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/PulseOps uses deterministic simulated telemetry/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Start simulation' })[0],
    ).toHaveAttribute('href', '/app/overview?demo=start');
    expect(
      screen.queryByRole('navigation', { name: 'Mobile primary navigation' }),
    ).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('redirects /app to Overview', async () => {
    const router = renderRoute('/app');

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Overview' },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/app/overview');
  });

  it.each([
    ['/app/overview', 'Overview'],
    ['/app/incidents', 'Incidents'],
    [
      '/app/incidents/incident-payments-latency',
      'Elevated payment authorization latency',
    ],
    ['/app/services', 'Services'],
    ['/app/services/payments-api', 'Payments API'],
  ])('renders %s with the correct heading', async (path, heading) => {
    renderRoute(path);
    expect(
      await screen.findByRole('heading', { level: 1, name: heading }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Mobile primary navigation' }),
    ).toBeInTheDocument();
  });

  it('marks the current sidebar link as active', async () => {
    renderRoute('/app/incidents/incident-42');
    const navigation = await screen.findByRole(
      'navigation',
      {
        name: 'Mobile primary navigation',
      },
      { timeout: 5_000 },
    );

    expect(
      within(navigation).getByRole('link', { name: 'Incidents' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('renders an accessible not-found page', async () => {
    renderRoute('/missing');

    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Page not found' },
        { timeout: 5_000 },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Return home' }),
    ).toBeInTheDocument();
  });
});
