import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { AppProviders } from '../../app/providers/AppProviders';
import { createAppStore } from '../../app/store/store';
import {
  DEGRADATION_TICK_MS,
  INCIDENT_TRANSITION_MS,
  RECOVERY_TICK_MS,
} from '../../features/incident-simulation/model/simulationScenario';
import { resetSimulation } from '../../features/incident-simulation/model/simulationSlice';
import { overviewFixture } from '../../shared/api/mocks/fixtures';
import { mockServer } from '../../shared/api/mocks/server';
import { OverviewPage } from './OverviewPage';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderOverview(initialEntry = '/app/overview') {
  const store = createAppStore();
  const view = render(
    <AppProviders store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <OverviewPage />
        <LocationProbe />
      </MemoryRouter>
    </AppProviders>,
  );
  return { store, ...view };
}

describe('OverviewPage states', () => {
  it('preserves the page geometry while loading', () => {
    mockServer.use(
      http.get('*/api/overview', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const { container } = renderOverview();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading overview data',
    );
    expect(
      container.querySelectorAll('[class*="skeletonMetric"]'),
    ).toHaveLength(4);
  });

  it('renders a safe error and retries successfully', async () => {
    let attempts = 0;
    mockServer.use(
      http.get('*/api/overview', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              {
                error: {
                  code: 'TEMPORARY',
                  message: 'Try the snapshot again.',
                },
              },
              { status: 503 },
            )
          : HttpResponse.json(overviewFixture);
      }),
    );
    renderOverview();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Try the snapshot again.');
    fireEvent.click(
      within(alert).getByRole('button', { name: 'Retry request' }),
    );

    expect(
      await screen.findByText('Overall system status'),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('renders local empty states while preserving available sections', async () => {
    mockServer.use(
      http.get('*/api/overview', () =>
        HttpResponse.json({ ...overviewFixture, metrics: [] }),
      ),
    );
    renderOverview();

    expect(
      await screen.findByRole('heading', { name: 'No performance data' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Payments API')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Latest events' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: /Latency and error rate/ }),
    ).not.toBeInTheDocument();
  });

  it('renders a dedicated full empty state', async () => {
    mockServer.use(
      http.get('*/api/overview', () =>
        HttpResponse.json({
          ...overviewFixture,
          services: [],
          metrics: [],
          recentEvents: [],
        }),
      ),
    );
    renderOverview();

    expect(
      await screen.findByRole('heading', { name: 'No overview data yet' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('P95 latency')).not.toBeInTheDocument();
  });
});

describe('OverviewPage data and controls', () => {
  it('renders status, four formatted KPIs, services, events and links', async () => {
    renderOverview();

    expect(
      await screen.findByText('Overall system status'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Operational')).toHaveLength(5);
    const kpis = screen.getByLabelText('Key performance indicators');
    expect(within(kpis).getByText('P95 latency')).toBeInTheDocument();
    expect(within(kpis).getByText('147 ms')).toBeInTheDocument();
    expect(within(kpis).getByText('0.21%')).toBeInTheDocument();
    expect(within(kpis).getByText('1,304 req/min')).toBeInTheDocument();
    expect(
      within(kpis).getByRole('link', { name: 'Active incidents: 3' }),
    ).toHaveAttribute('href', '/app/incidents');

    const serviceLinks = screen
      .getAllByRole('link')
      .filter((link) =>
        link.getAttribute('href')?.startsWith('/app/services/service-'),
      );
    expect(serviceLinks).toHaveLength(4);
    expect(serviceLinks[0]).toHaveAttribute(
      'href',
      '/app/services/service-payments',
    );

    expect(screen.getAllByText('Incident created')[0]).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'View all incidents' }),
    ).toHaveAttribute('href', '/app/incidents');
    expect(
      screen.getByRole('link', { name: 'View all services' }),
    ).toHaveAttribute('href', '/app/services');
  });

  it('sorts activity newest first and links each event to its incident', async () => {
    renderOverview();

    const feed = await screen.findByRole('heading', { name: 'Latest events' });
    const list = feed.closest('section')?.querySelector('ol');
    expect(list).not.toBeNull();
    const items = list?.querySelectorAll('li');
    expect(items?.[0]).toHaveTextContent(
      'Incident created from queue delay alert.',
    );
    expect(items?.[1]).toHaveTextContent(
      'Delivery delay exceeded the warning threshold.',
    );
    expect(within(items?.[0] as HTMLElement).getByRole('link')).toHaveAttribute(
      'href',
      '/app/incidents/incident-notification-delay',
    );
  });

  it('uses Redux as the only time-range source and filters from the latest point', async () => {
    const { store } = renderOverview();

    await screen.findByText('Overall system status');
    const thirtyMinutes = screen.getByRole('radio', { name: '30 min' });
    const sixHours = screen.getByRole('radio', { name: '6 hours' });
    expect(thirtyMinutes).toBeChecked();
    expect(store.getState().preferences.timeRange).toBe('30m');
    expect(screen.getAllByRole('row')).toHaveLength(3);

    fireEvent.click(sixHours);

    expect(sixHours).toBeChecked();
    expect(store.getState().preferences.timeRange).toBe('6h');
    expect(screen.getAllByRole('row')).toHaveLength(14);
  });

  it('gives the chart an accessible name, description and data fallback', async () => {
    renderOverview();

    const chart = await screen.findByRole('img', {
      name: 'Latency and error rate for the latest 30 minutes',
    });
    expect(chart).toBeInTheDocument();
    expect(
      screen.getByText(/ending at the most recent timestamp in the dataset/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: 'Latency and error rate values' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Jul 19, 2026, 06:00 UTC')).toBeInTheDocument();
  });
});

describe('OverviewPage incident simulation', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows accessible idle controls and runs through recovery to resolved', async () => {
    const { store } = renderOverview();
    await screen.findByText('Overall system status');
    expect(
      screen.getByRole('button', { name: 'Start simulation' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'The simulated environment is stable.',
    );
    expect(screen.getByLabelText('Simulation progress')).toBeInTheDocument();

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Start simulation' }));
    expect(screen.getByRole('status')).toHaveTextContent('Simulation started');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS * 3);
    });
    expect(screen.getAllByText('Degraded').length).toBeGreaterThan(0);
    expect(screen.getByText('Payments API').closest('li')).toHaveTextContent(
      'Degraded',
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(
        DEGRADATION_TICK_MS * 2 + INCIDENT_TRANSITION_MS,
      );
    });
    expect(store.getState().simulation.phase).toBe('investigating');
    expect(screen.getAllByText('Incident investigating')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Begin recovery' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: /Open incident for event: SEV-2 incident created/i,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Begin recovery' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(RECOVERY_TICK_MS * 5);
    });

    expect(store.getState().simulation.phase).toBe('resolved');
    expect(screen.getAllByText('Incident resolved')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Incident resolved. Payments API and telemetry are stable.',
    );
    expect(screen.getByText('Payments API').closest('li')).toHaveTextContent(
      'Operational',
    );
    expect(
      screen.getByRole('button', { name: 'Reset demo' }),
    ).toBeInTheDocument();
    store.dispatch(resetSimulation());
  });

  it('auto-starts demo=start once and removes the query parameter', async () => {
    const { store } = renderOverview('/app/overview?demo=start');

    expect(await screen.findAllByText('Telemetry degrading')).not.toHaveLength(
      0,
    );
    expect(store.getState().simulation.phase).toBe('degrading');
    expect(store.getState().simulation.runId).toBe(1);
    await waitFor(() =>
      expect(screen.getByTestId('location-search')).toBeEmptyDOMElement(),
    );
    store.dispatch(resetSimulation());
  });

  it('keeps business state changes when reduced motion is requested', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const { store } = renderOverview();
    await screen.findByText('Stable baseline');
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Start simulation' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS);
    });
    expect(store.getState().simulation.appendedMetricPoints).toHaveLength(1);
    store.dispatch(resetSimulation());
    vi.unstubAllGlobals();
  });

  it('continues one timer chain across Overview unmount and remount', async () => {
    const firstView = renderOverview();
    await screen.findByText('Stable baseline');
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Start simulation' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS);
    });
    expect(
      firstView.store.getState().simulation.appendedMetricPoints,
    ).toHaveLength(1);

    firstView.unmount();
    render(
      <AppProviders store={firstView.store}>
        <MemoryRouter initialEntries={['/app/overview']}>
          <OverviewPage />
        </MemoryRouter>
      </AppProviders>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS);
    });

    expect(
      firstView.store.getState().simulation.appendedMetricPoints,
    ).toHaveLength(2);
    firstView.store.dispatch(resetSimulation());
  });
});
