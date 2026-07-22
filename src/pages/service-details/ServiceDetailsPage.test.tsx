import { render, screen, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppProviders } from '../../app/providers/AppProviders';
import { createAppStore, type AppStore } from '../../app/store/store';
import {
  incidentCreated,
  startSimulation,
} from '../../features/incident-simulation/model/simulationSlice';
import { buildSimulationScenario } from '../../features/incident-simulation/model/simulationScenario';
import {
  getServiceDependencies,
  incidentsFixture,
  metricPointsFixture,
  servicesFixture,
} from '../../shared/api/mocks/fixtures';
import { mockServer } from '../../shared/api/mocks/server';
import { ServiceDetailsPage } from './ServiceDetailsPage';

function renderDetails(
  serviceId = 'service-checkout',
  store: AppStore = createAppStore(),
) {
  return render(
    <AppProviders store={store}>
      <MemoryRouter initialEntries={[`/app/services/${serviceId}`]}>
        <Routes>
          <Route
            path="/app/services/:serviceId"
            element={<ServiceDetailsPage />}
          />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('ServiceDetailsPage', () => {
  it('renders loading and service-specific not-found states', async () => {
    mockServer.use(
      http.get('*/api/services/:id', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    const loading = renderDetails();
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'Loading service details',
    );
    loading.unmount();
    mockServer.resetHandlers();
    renderDetails('missing');
    expect(
      await screen.findByRole('heading', { name: 'Service not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Return to Services' }),
    ).toHaveAttribute('href', '/app/services');
  });

  it('renders reliability, telemetry, dependencies, incidents and canonical links', async () => {
    renderDetails();
    expect(
      await screen.findByRole('heading', { name: 'Checkout Web' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('99.90%')).toBeInTheDocument();
    expect(screen.getByText('99.96%')).toBeInTheDocument();
    expect(screen.getByText('Meeting SLO')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: 'Service telemetry sample for Checkout Web',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', {
        name: 'Service telemetry sample values for Checkout Web',
      }),
    ).toBeInTheDocument();
    const dependencies = screen.getByRole('list', {
      name: 'Direct dependencies',
    });
    expect(within(dependencies).getAllByRole('listitem')).toHaveLength(2);
    expect(
      within(dependencies).getByRole('link', { name: /Payments API/ }),
    ).toHaveAttribute('href', '/app/services/service-payments');
    expect(
      screen.getByRole('link', { name: 'Checkout submission errors' }),
    ).toHaveAttribute('href', '/app/incidents/incident-checkout-errors');
    expect(
      screen.getByRole('link', { name: 'View related incidents' }),
    ).toHaveAttribute('href', '/app/incidents?serviceId=service-checkout');
    expect(screen.getByRole('link', { name: 'Filtered list' })).toHaveAttribute(
      'href',
      '/app/incidents?serviceId=service-checkout',
    );
  });

  it('renders neutral section empty states', async () => {
    const identity = servicesFixture.find(
      ({ id }) => id === 'service-identity',
    );
    if (!identity) throw new Error('Identity fixture is required.');
    mockServer.use(
      http.get('*/api/services/:id', () =>
        HttpResponse.json({
          service: identity,
          dependencies: [],
          incidents: [],
          metrics: [],
        }),
      ),
    );
    renderDetails('service-identity');
    expect(
      await screen.findByRole('heading', { name: 'Identity' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No service telemetry' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No direct dependencies' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No recent incidents' }),
    ).toBeInTheDocument();
  });

  it('integrates the client-only demo incident on Payments only', async () => {
    const baselinePoint = metricPointsFixture.at(-1);
    if (!baselinePoint) throw new Error('A baseline point is required.');
    const scenario = buildSimulationScenario(baselinePoint);
    const store = createAppStore();
    store.dispatch(startSimulation({ baselinePoint }));
    store.dispatch(
      incidentCreated({
        incident: scenario.incident,
        events: scenario.incidentCreatedEvents,
      }),
    );
    renderDetails('service-payments', store);
    expect(await screen.findByText('Demo incident')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: scenario.incident.title }),
    ).toHaveAttribute('href', `/app/incidents/${scenario.incident.id}`);
    expect(
      screen
        .getByRole('heading', { name: 'Recent incidents' })
        .closest('section'),
    ).toHaveTextContent('Elevated payment authorization latency');
  });

  it('keeps malformed details as a common validation error', async () => {
    const service = servicesFixture[0];
    if (!service) throw new Error('A service fixture is required.');
    mockServer.use(
      http.get('*/api/services/:id', () =>
        HttpResponse.json({
          service,
          dependencies: getServiceDependencies(service.id),
          incidents: incidentsFixture,
          metrics: [{ broken: true }],
        }),
      ),
    );
    renderDetails(service.id);
    expect(
      await screen.findByRole('heading', {
        name: 'Service details unavailable',
      }),
    ).toBeInTheDocument();
  });
});
