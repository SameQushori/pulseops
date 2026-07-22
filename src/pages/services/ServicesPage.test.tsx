import { fireEvent, render, screen, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';

import { AppProviders } from '../../app/providers/AppProviders';
import { createAppStore } from '../../app/store/store';
import {
  degradationTick,
  startSimulation,
} from '../../features/incident-simulation/model/simulationSlice';
import {
  metricPointsFixture,
  servicesFixture,
} from '../../shared/api/mocks/fixtures';
import { mockServer } from '../../shared/api/mocks/server';
import { ServicesPage } from './ServicesPage';

function renderPage() {
  const store = createAppStore();
  const view = render(
    <AppProviders store={store}>
      <MemoryRouter>
        <ServicesPage />
      </MemoryRouter>
    </AppProviders>,
  );
  return { store, ...view };
}

describe('ServicesPage', () => {
  it('preserves four-record geometry while loading', () => {
    mockServer.use(
      http.get('*/api/services', async () => {
        await delay('infinite');
        return HttpResponse.json({ items: [], total: 0 });
      }),
    );
    const { container } = renderPage();
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading services');
    expect(container.querySelectorAll('[class*="skeletonCard"]')).toHaveLength(
      4,
    );
  });

  it('renders four service records, values and detail links without catalog controls', async () => {
    renderPage();
    expect(await screen.findByText('4 monitored services')).toBeInTheDocument();
    expect(
      screen.getByText('4 operational · 0 degraded · 0 outage'),
    ).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Monitored services' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(
      within(list).getByRole('link', { name: /Payments API/ }),
    ).toHaveAttribute('href', '/app/services/service-payments');
    expect(within(list).getByText('99.98%')).toBeInTheDocument();
    expect(
      within(list).getByText('Jul 18, 2026, 2:20 PM UTC'),
    ).toBeInTheDocument();
    expect(within(list).getAllByText('Meeting SLO')).toHaveLength(4);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.queryByText(/pagination/i)).not.toBeInTheDocument();
  });

  it('renders empty and retryable error states', async () => {
    mockServer.use(
      http.get('*/api/services', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );
    const first = renderPage();
    expect(
      await screen.findByRole('heading', { name: 'No services configured' }),
    ).toBeInTheDocument();
    first.unmount();
    let attempts = 0;
    mockServer.use(
      http.get('*/api/services', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json(
              { error: { code: 'TEMPORARY', message: 'Try services again.' } },
              { status: 503 },
            )
          : HttpResponse.json({ items: servicesFixture, total: 4 });
      }),
    );
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Try services again.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry request' }));
    expect(await screen.findByText('4 monitored services')).toBeInTheDocument();
  });

  it('marks only the simulated Payments degradation', async () => {
    const { store } = renderPage();
    await screen.findByText('4 monitored services');
    const baselinePoint = metricPointsFixture.at(-1);
    if (!baselinePoint) throw new Error('A baseline metric is required.');
    store.dispatch(startSimulation({ baselinePoint }));
    store.dispatch(degradationTick({ point: baselinePoint, index: 2 }));
    expect(
      await screen.findByText('Simulated degradation'),
    ).toBeInTheDocument();
    expect(screen.getByText('Payments API').closest('li')).toHaveTextContent(
      'Degraded',
    );
    expect(
      screen.getByText('3 operational · 1 degraded · 0 outage'),
    ).toBeInTheDocument();
  });
});
