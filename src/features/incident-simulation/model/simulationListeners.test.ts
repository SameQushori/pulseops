import { createAppStore } from '../../../app/store/store';
import { metricPointsFixture } from '../../../shared/api/mocks/fixtures';
import { metricPointSchema } from '../../../entities/metric/model/metricPoint';
import {
  buildSimulationScenario,
  DEGRADATION_TICK_MS,
  INCIDENT_TRANSITION_MS,
  RECOVERY_TICK_MS,
} from './simulationScenario';
import {
  beginRecovery,
  resetSimulation,
  startSimulation,
} from './simulationSlice';

const baselinePoint = metricPointSchema.parse(metricPointsFixture.at(-1));
const scenario = buildSimulationScenario(baselinePoint);
const degradationDuration =
  scenario.degradationPoints.length * DEGRADATION_TICK_MS +
  INCIDENT_TRANSITION_MS;
const recoveryDuration = scenario.recoveryPoints.length * RECOVERY_TICK_MS;

describe('simulation listener workflow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('runs the complete deterministic workflow and creates one incident', async () => {
    const store = createAppStore();
    store.dispatch(startSimulation({ baselinePoint }));

    await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS * 2);
    expect(store.getState().simulation.appendedMetricPoints).toEqual(
      scenario.degradationPoints.slice(0, 2),
    );
    expect(store.getState().simulation.serviceStatusOverride).toBeNull();

    await vi.advanceTimersByTimeAsync(
      degradationDuration - DEGRADATION_TICK_MS * 2,
    );
    expect(store.getState().simulation.phase).toBe('investigating');
    expect(store.getState().simulation.simulatedIncident?.id).toBe(
      scenario.incident.id,
    );
    expect(
      store
        .getState()
        .simulation.generatedEvents.filter((event) => event.type === 'created'),
    ).toHaveLength(1);

    store.dispatch(beginRecovery(scenario.monitoringEvent));
    await vi.advanceTimersByTimeAsync(recoveryDuration);

    expect(store.getState().simulation.phase).toBe('resolved');
    expect(store.getState().simulation.appendedMetricPoints).toEqual([
      ...scenario.degradationPoints,
      ...scenario.recoveryPoints,
    ]);
    expect(store.getState().simulation.simulatedIncident?.status).toBe(
      'resolved',
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not begin recovery before investigating', () => {
    const store = createAppStore();
    store.dispatch(startSimulation({ baselinePoint }));
    store.dispatch(beginRecovery(scenario.monitoringEvent));
    expect(store.getState().simulation.phase).toBe('degrading');
  });

  it('does not start a second workflow during an active run', async () => {
    const store = createAppStore();
    store.dispatch(startSimulation({ baselinePoint }));
    store.dispatch(startSimulation({ baselinePoint }));
    await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS);

    expect(store.getState().simulation.runId).toBe(1);
    expect(store.getState().simulation.appendedMetricPoints).toHaveLength(1);
    store.dispatch(resetSimulation());
  });

  it('cancels remaining ticks on reset', async () => {
    const store = createAppStore();
    store.dispatch(startSimulation({ baselinePoint }));
    await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS);
    store.dispatch(resetSimulation());
    await vi.runAllTimersAsync();

    expect(store.getState().simulation.phase).toBe('idle');
    expect(store.getState().simulation.appendedMetricPoints).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('replays identical points, IDs and timestamps after reset', async () => {
    const store = createAppStore();
    const run = async () => {
      store.dispatch(startSimulation({ baselinePoint }));
      await vi.advanceTimersByTimeAsync(degradationDuration);
      const result = structuredClone(store.getState().simulation);
      store.dispatch(resetSimulation());
      return result;
    };

    const first = await run();
    const second = await run();
    expect(second.appendedMetricPoints).toEqual(first.appendedMetricPoints);
    expect(second.simulatedIncident).toEqual(first.simulatedIncident);
    expect(second.generatedEvents).toEqual(first.generatedEvents);
    store.dispatch(resetSimulation());
  });

  it('keeps listener tasks and state isolated between stores', async () => {
    const first = createAppStore();
    const second = createAppStore();
    first.dispatch(startSimulation({ baselinePoint }));

    await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS * 2);
    expect(first.getState().simulation.appendedMetricPoints).toHaveLength(2);
    expect(second.getState().simulation.appendedMetricPoints).toHaveLength(0);

    second.dispatch(startSimulation({ baselinePoint }));
    await vi.advanceTimersByTimeAsync(DEGRADATION_TICK_MS);
    expect(first.getState().simulation.appendedMetricPoints).toHaveLength(3);
    expect(second.getState().simulation.appendedMetricPoints).toHaveLength(1);
    first.dispatch(resetSimulation());
    second.dispatch(resetSimulation());
  });
});
