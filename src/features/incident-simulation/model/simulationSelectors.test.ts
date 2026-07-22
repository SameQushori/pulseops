import { createAppStore } from '../../../app/store/store';
import { metricPointsFixture } from '../../../shared/api/mocks/fixtures';
import { metricPointSchema } from '../../../entities/metric/model/metricPoint';
import {
  selectCanBeginRecovery,
  selectCanResetSimulation,
  selectCanStartSimulation,
  selectIsSimulationRunning,
  selectSimulatedIncident,
} from './simulationSelectors';
import { buildSimulationScenario } from './simulationScenario';
import {
  incidentCreated,
  investigatingEntered,
  startSimulation,
} from './simulationSlice';

describe('simulation selectors', () => {
  it('exposes capabilities without leaking component logic', () => {
    const store = createAppStore();
    const baselinePoint = metricPointSchema.parse(metricPointsFixture.at(-1));
    const scenario = buildSimulationScenario(baselinePoint);

    expect(selectCanStartSimulation(store.getState())).toBe(true);
    expect(selectCanBeginRecovery(store.getState())).toBe(false);
    expect(selectCanResetSimulation(store.getState())).toBe(false);

    store.dispatch(startSimulation({ baselinePoint }));
    expect(selectIsSimulationRunning(store.getState())).toBe(true);
    expect(selectCanStartSimulation(store.getState())).toBe(false);
    expect(selectCanResetSimulation(store.getState())).toBe(true);

    store.dispatch(
      incidentCreated({
        incident: scenario.incident,
        events: scenario.incidentCreatedEvents,
      }),
    );
    store.dispatch(investigatingEntered(scenario.investigatingEvent));
    expect(selectCanBeginRecovery(store.getState())).toBe(true);
    expect(selectIsSimulationRunning(store.getState())).toBe(true);
    expect(selectSimulatedIncident(store.getState())?.id).toBe(
      scenario.incident.id,
    );

    store.dispatch({ type: 'simulation/resetSimulation' });
  });
});
