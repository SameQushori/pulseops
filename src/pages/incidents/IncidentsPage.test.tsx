import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
} from 'react-router-dom';

import { AppProviders } from '../../app/providers/AppProviders';
import { createAppStore, type AppStore } from '../../app/store/store';
import {
  incidentCreated,
  resetSimulation,
  startSimulation,
} from '../../features/incident-simulation/model/simulationSlice';
import { buildSimulationScenario } from '../../features/incident-simulation/model/simulationScenario';
import {
  incidentsFixture,
  metricPointsFixture,
} from '../../shared/api/mocks/fixtures';
import { mockServer } from '../../shared/api/mocks/server';
import { IncidentDetailsPage } from '../incident-details/IncidentDetailsPage';
import { IncidentsPage } from './IncidentsPage';

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">{location.pathname + location.search}</div>
  );
}

function renderIncidents(
  initialEntries = ['/app/incidents'],
  store: AppStore = createAppStore(),
) {
  const router = createMemoryRouter(
    [
      {
        path: '/app/incidents',
        element: (
          <>
            <IncidentsPage />
            <LocationProbe />
          </>
        ),
      },
      {
        path: '/app/incidents/:incidentId',
        element: <IncidentDetailsPage />,
      },
    ],
    { initialEntries },
  );
  const view = render(
    <AppProviders store={store}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, router, store };
}

async function waitForDefaultList() {
  expect(await screen.findByText('Showing 6 incidents')).toBeInTheDocument();
  return screen.getByRole('table', {
    name: 'Incidents matching the applied filters',
  });
}

describe('IncidentsPage', () => {
  it('keeps labelled filters visible while the list is loading', () => {
    mockServer.use(
      http.get('*/api/incidents', async () => {
        await delay('infinite');
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );
    renderIncidents();

    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText('Search incidents')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Severity')).toBeInTheDocument();
    expect(screen.getByLabelText('Service')).toBeDisabled();
    expect(screen.getByLabelText('Sort')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading incidents');
  });

  it('renders the default sorted table with service names and detail links', async () => {
    renderIncidents();
    const table = await waitForDefaultList();
    const rows = within(table).getAllByRole('row');

    expect(rows).toHaveLength(7);
    expect(rows[1]).toHaveTextContent('Delayed transactional notifications');
    expect(rows[1]).toHaveTextContent('Notifications');
    expect(
      within(table).getByRole('link', {
        name: 'Elevated payment authorization latency',
      }),
    ).toHaveAttribute('href', '/app/incidents/incident-payments-latency');
    expect(within(table).getAllByText('SEV-1 Critical')).toHaveLength(2);
    expect(within(table).getByText('Investigating')).toBeInTheDocument();
  });

  it('distinguishes an empty API from filtered no-results', async () => {
    mockServer.use(
      http.get('*/api/incidents', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );
    const { unmount } = renderIncidents();
    expect(
      await screen.findByRole('heading', { name: 'No incidents yet' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Go to Overview' }),
    ).toHaveAttribute('href', '/app/overview');
    unmount();

    renderIncidents(['/app/incidents?query=does-not-exist']);
    expect(
      await screen.findByRole('heading', { name: 'No matching incidents' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Showing 0 incidents')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Clear filters' }),
    ).toHaveLength(2);
  });

  it('shows an explicit retryable API error without hiding filters', async () => {
    let attempts = 0;
    mockServer.use(
      http.get('*/api/incidents', () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json(
            { error: { code: 'TEMPORARY', message: 'Try incidents again.' } },
            { status: 503 },
          );
        }
        const items = incidentsFixture.filter(
          ({ severity }) => severity === 'sev2',
        );
        return HttpResponse.json({ items, total: items.length });
      }),
    );
    renderIncidents(['/app/incidents?severity=sev2']);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Try incidents again.',
    );
    expect(screen.getByLabelText('Severity')).toHaveValue('sev2');
    fireEvent.click(screen.getByRole('button', { name: 'Retry request' }));
    expect(await screen.findByText('Showing 2 incidents')).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('keeps incidents readable when service labels fail', async () => {
    mockServer.use(
      http.get('*/api/services', () =>
        HttpResponse.json(
          { error: { code: 'SERVICE_DOWN', message: 'No services.' } },
          { status: 503 },
        ),
      ),
    );
    renderIncidents();
    const table = await waitForDefaultList();

    expect(screen.getByLabelText('Service')).toBeDisabled();
    expect(
      screen.getByText(/Service labels are unavailable/),
    ).toBeInTheDocument();
    expect(
      within(table).getAllByText('service-notifications')[0],
    ).toBeInTheDocument();
  });

  it('submits and clears search through the URL', async () => {
    renderIncidents();
    await waitForDefaultList();
    const search = screen.getByLabelText('Search incidents');

    fireEvent.change(search, { target: { value: '  checkout  ' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    expect(await screen.findByText('Showing 2 incidents')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/app/incidents?query=checkout',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByText('Showing 6 incidents')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/app/incidents');
  });

  it('updates selects canonically and clear removes every page param', async () => {
    renderIncidents(['/app/incidents?unrelated=drop-me&sort=newest']);
    await waitForDefaultList();
    expect(screen.getByTestId('location')).toHaveTextContent('/app/incidents');

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'resolved' },
    });
    fireEvent.change(screen.getByLabelText('Severity'), {
      target: { value: 'sev1' },
    });
    fireEvent.change(screen.getByLabelText('Service'), {
      target: { value: 'service-identity' },
    });
    fireEvent.change(screen.getByLabelText('Sort'), {
      target: { value: 'oldest' },
    });

    expect(await screen.findByText('Showing 1 incident')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/app/incidents?status=resolved&severity=sev1&serviceId=service-identity&sort=oldest',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('Showing 6 incidents')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/app/incidents');
  });

  it('removes an unknown service ID after service data validates the URL', async () => {
    renderIncidents([
      '/app/incidents?serviceId=service-missing&status=resolved',
    ]);

    expect(
      await screen.findByText('Showing 3 incidents', {}, { timeout: 2_000 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Service')).toHaveValue('');
    expect(screen.getByLabelText('Status')).toHaveValue('resolved');
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/app/incidents?status=resolved',
    );
  });

  it('synchronizes the search draft when history restores the URL', async () => {
    const { router } = renderIncidents();
    await waitForDefaultList();
    const search = screen.getByLabelText('Search incidents');

    fireEvent.change(search, { target: { value: 'checkout' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(await screen.findByText('Showing 2 incidents')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'unsaved draft' } });

    await act(() => router.navigate(-1));
    expect(screen.getByLabelText('Search incidents')).toHaveValue('');
    expect(await screen.findByText('Showing 6 incidents')).toBeInTheDocument();

    await act(() => router.navigate(1));
    expect(screen.getByLabelText('Search incidents')).toHaveValue('checkout');
    expect(await screen.findByText('Showing 2 incidents')).toBeInTheDocument();
  });

  it('restores controls and query results through browser back and forward', async () => {
    const { router } = renderIncidents();
    await waitForDefaultList();

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'monitoring' },
    });
    expect(await screen.findByText('Showing 1 incident')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Severity'), {
      target: { value: 'sev1' },
    });
    expect(screen.getByTestId('location')).toHaveTextContent(
      '?status=monitoring&severity=sev1',
    );

    await act(() => router.navigate(-1));
    expect(screen.getByLabelText('Status')).toHaveValue('monitoring');
    expect(screen.getByLabelText('Severity')).toHaveValue('');
    expect(await screen.findByText('Showing 1 incident')).toBeInTheDocument();

    await act(() => router.navigate(-1));
    expect(screen.getByLabelText('Status')).toHaveValue('');
    expect(await screen.findByText('Showing 6 incidents')).toBeInTheDocument();

    await act(() => router.navigate(1));
    expect(screen.getByLabelText('Status')).toHaveValue('monitoring');
  });

  it('merges and links the simulated incident without creating a dead details flow', async () => {
    const store = createAppStore();
    const baselinePoint = metricPointsFixture.at(-1);
    if (!baselinePoint) throw new Error('A baseline point is required.');
    const scenario = buildSimulationScenario(baselinePoint);
    store.dispatch(startSimulation({ baselinePoint }));
    store.dispatch(
      incidentCreated({
        incident: scenario.incident,
        events: scenario.incidentCreatedEvents,
      }),
    );
    const { unmount } = renderIncidents(['/app/incidents'], store);

    expect(await screen.findByText('Showing 7 incidents')).toBeInTheDocument();
    expect(screen.getByText('Demo incident')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('link', { name: scenario.incident.title }),
    );
    expect(
      await screen.findByRole('heading', { name: scenario.incident.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Timeline' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Incident status')).toBeInTheDocument();

    unmount();
    store.dispatch(resetSimulation());
  });
});
