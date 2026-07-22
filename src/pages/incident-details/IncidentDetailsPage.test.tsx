import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppProviders } from '../../app/providers/AppProviders';
import { createAppStore, type AppStore } from '../../app/store/store';
import { metricPointSchema } from '../../entities/metric/model/metricPoint';
import { buildSimulationScenario } from '../../features/incident-simulation/model/simulationScenario';
import {
  incidentCreated,
  investigatingEntered,
  resetSimulation,
  startSimulation,
} from '../../features/incident-simulation/model/simulationSlice';
import { metricPointsFixture } from '../../shared/api/mocks/fixtures';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Line: () => null,
}));

import { IncidentDetailsPage } from './IncidentDetailsPage';

function renderDetails(id: string, store: AppStore = createAppStore()) {
  render(
    <AppProviders store={store}>
      <MemoryRouter initialEntries={[`/app/incidents/${id}`]}>
        <Routes>
          <Route
            path="/app/incidents/:incidentId"
            element={<IncidentDetailsPage />}
          />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
  return store;
}

function createSimulationStore() {
  const store = createAppStore();
  const baselinePoint = metricPointSchema.parse(metricPointsFixture.at(-1));
  const scenario = buildSimulationScenario(baselinePoint);
  store.dispatch(startSimulation({ baselinePoint }));
  store.dispatch(
    incidentCreated({
      incident: scenario.incident,
      events: scenario.incidentCreatedEvents,
    }),
  );
  store.dispatch(investigatingEntered(scenario.investigatingEvent));
  return { store, scenario };
}

describe('IncidentDetailsPage', () => {
  it('renders the unified API details composition and terminal status', async () => {
    renderDetails('incident-payments-latency');
    expect(
      await screen.findByRole('heading', {
        name: 'Elevated payment authorization latency',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Payments API' })).toHaveAttribute(
      'href',
      '/app/services/service-payments',
    );
    expect(
      screen.getByRole('heading', { name: 'Timeline' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByLabelText('Incident status')).toBeDisabled();
    expect(screen.getAllByText('48m')).toHaveLength(2);
    expect(
      await screen.findByRole('img', {
        name: /Related latency and error rate/,
      }),
    ).toBeInTheDocument();
  });

  it('updates owner and status through allowed options', async () => {
    renderDetails('incident-notification-delay');
    const owner = await screen.findByLabelText('Incident owner');
    fireEvent.change(owner, { target: { value: 'Maya Chen' } });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Owner changed to Maya Chen',
    );
    await waitFor(() => expect(owner).toHaveValue('Maya Chen'));

    const status = screen.getByLabelText('Incident status');
    expect(
      Array.from((status as HTMLSelectElement).options).map(
        ({ value }) => value,
      ),
    ).toEqual(['investigating', 'identified', 'monitoring']);
    fireEvent.change(status, { target: { value: 'identified' } });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Status changed to identified',
    );
  });

  it('validates and adds a text note in the accessible dialog', async () => {
    renderDetails('incident-notification-delay');
    const trigger = await screen.findByRole('button', { name: 'Add note' });
    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Add incident note' });
    expect(dialog).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    const reopenedDialog = screen.getByRole('dialog', {
      name: 'Add incident note',
    });
    fireEvent.click(
      within(reopenedDialog).getByRole('button', { name: 'Add note' }),
    );
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Note'), {
      target: { value: '<strong>Investigating queue depth</strong>' },
    });
    fireEvent.click(
      within(reopenedDialog).getByRole('button', { name: 'Add note' }),
    );
    expect(
      await screen.findByText('<strong>Investigating queue depth</strong>'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('uses the same workflow for simulation and shows reset disappearance', async () => {
    const { store, scenario } = createSimulationStore();
    renderDetails(scenario.incident.id, store);
    expect(await screen.findByText(/Demo incident/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Incident owner'), {
      target: { value: 'Noah Williams' },
    });
    expect(screen.getByLabelText('Incident owner')).toHaveValue(
      'Noah Williams',
    );
    fireEvent.change(screen.getByLabelText('Incident status'), {
      target: { value: 'identified' },
    });
    expect(screen.getByLabelText('Incident status')).toHaveValue('identified');
    store.dispatch(resetSimulation());
    expect(await screen.findByText(/simulation was reset/)).toBeInTheDocument();
  });

  it('handles an unknown incident ID', async () => {
    renderDetails('incident-missing');
    expect(
      await screen.findByRole('heading', { name: 'Incident not found' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Return to Incidents' }),
    ).toHaveAttribute('href', '/app/incidents');
  });
});
