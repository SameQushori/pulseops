import { fireEvent, render, screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { AppProviders } from '../app/providers/AppProviders';
import { createAppStore } from '../app/store/store';
import { overviewFixture } from '../shared/api/mocks/fixtures';
import { mockServer } from '../shared/api/mocks/server';
import { IncidentsPage } from './incidents/IncidentsPage';
import { OverviewPage } from './overview/OverviewPage';
import { ServicesPage } from './services/ServicesPage';

function renderPage(page: ReactElement) {
  return render(
    <AppProviders store={createAppStore()}>
      <MemoryRouter>{page}</MemoryRouter>
    </AppProviders>,
  );
}

describe('data-connected application pages', () => {
  it.each([
    ['overview', <OverviewPage />, '/api/overview', 'Loading overview data'],
    ['incidents', <IncidentsPage />, '/api/incidents', 'Loading incidents'],
    ['services', <ServicesPage />, '/api/services', 'Loading services'],
  ])('shows a loading state for %s', (_name, page, path, label) => {
    mockServer.use(
      http.get(`*${path}`, async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );
    renderPage(page);

    expect(screen.getByRole('status')).toHaveTextContent(label);
  });

  it.each([
    ['overview', <OverviewPage />, /Overall system status/],
    ['incidents', <IncidentsPage />, /Showing 6 incidents/],
    ['services', <ServicesPage />, /4 monitored services/],
  ])('shows validated success data for %s', async (_name, page, message) => {
    renderPage(page);
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it.each([
    ['overview', <OverviewPage />, '/api/overview'],
    ['incidents', <IncidentsPage />, '/api/incidents'],
    ['services', <ServicesPage />, '/api/services'],
  ])('shows a safe error state for %s', async (_name, page, path) => {
    mockServer.use(
      http.get(`*${path}`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'SERVICE_DOWN',
              message: 'Temporarily unavailable.',
            },
          },
          { status: 503 },
        ),
      ),
    );
    renderPage(page);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Temporarily unavailable.',
    );
  });

  it('shows the empty branch for an empty incidents response', async () => {
    mockServer.use(
      http.get('*/api/incidents', () =>
        HttpResponse.json({ items: [], total: 0 }),
      ),
    );
    renderPage(<IncidentsPage />);

    expect(
      await screen.findByRole('heading', { name: 'No incidents yet' }),
    ).toBeInTheDocument();
  });

  it('retries a failed request and renders success', async () => {
    let attempts = 0;
    mockServer.use(
      http.get('*/api/overview', () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json(
            { error: { code: 'TEMPORARY', message: 'Try again.' } },
            { status: 503 },
          );
        }
        return HttpResponse.json(overviewFixture);
      }),
    );
    renderPage(<OverviewPage />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Retry request' }),
    );

    expect(
      await screen.findByText(/Overall system status/),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
