import { metricPointsFixture } from '../../../shared/api/mocks/fixtures';
import { metricPointSchema } from '../../../entities/metric/model/metricPoint';
import {
  buildSimulationScenario,
  PAYMENTS_SERVICE_ID,
} from './simulationScenario';
import {
  addSimulatedNote,
  assignSimulatedOwner,
  beginRecovery,
  degradationTick,
  incidentCreated,
  incidentResolved,
  identifySimulatedIncident,
  initialSimulationState,
  investigatingEntered,
  recoveryTick,
  resetSimulation,
  simulationReducer,
  startSimulation,
} from './simulationSlice';

const baselinePoint = metricPointSchema.parse(metricPointsFixture.at(-1));
const scenario = buildSimulationScenario(baselinePoint);

function reachInvestigating() {
  let state = simulationReducer(
    initialSimulationState,
    startSimulation({ baselinePoint }),
  );
  scenario.degradationPoints.forEach((point, index) => {
    state = simulationReducer(state, degradationTick({ point, index }));
  });
  state = simulationReducer(
    state,
    incidentCreated({
      incident: scenario.incident,
      events: scenario.incidentCreatedEvents,
    }),
  );
  return simulationReducer(
    state,
    investigatingEntered(scenario.investigatingEvent),
  );
}

describe('simulationSlice state machine', () => {
  it('starts idle and follows every valid transition', () => {
    expect(initialSimulationState.phase).toBe('idle');
    let state = simulationReducer(
      initialSimulationState,
      startSimulation({ baselinePoint }),
    );
    expect(state.phase).toBe('degrading');

    scenario.degradationPoints.forEach((point, index) => {
      state = simulationReducer(state, degradationTick({ point, index }));
    });
    expect(state.appendedMetricPoints).toEqual(scenario.degradationPoints);
    expect(state.serviceStatusOverride).toBe('degraded');

    state = simulationReducer(
      state,
      incidentCreated({
        incident: scenario.incident,
        events: scenario.incidentCreatedEvents,
      }),
    );
    expect(state.phase).toBe('incident-created');
    expect(state.simulatedIncident?.serviceId).toBe(PAYMENTS_SERVICE_ID);

    state = simulationReducer(
      state,
      investigatingEntered(scenario.investigatingEvent),
    );
    expect(state.phase).toBe('investigating');

    state = simulationReducer(state, beginRecovery(scenario.monitoringEvent));
    expect(state.phase).toBe('recovering');
    expect(state.simulatedIncident?.status).toBe('monitoring');

    scenario.recoveryPoints.forEach((point, index) => {
      state = simulationReducer(state, recoveryTick({ point, index }));
    });
    expect(state.serviceStatusOverride).toBe('operational');

    state = simulationReducer(state, incidentResolved(scenario.resolvedEvent));
    expect(state.phase).toBe('resolved');
    expect(state.simulatedIncident).toMatchObject({
      status: 'resolved',
      resolvedAt: scenario.resolvedEvent.createdAt,
    });
  });

  it('ignores invalid and repeated transitions', () => {
    const idleAfterInvalid = simulationReducer(
      initialSimulationState,
      beginRecovery(scenario.monitoringEvent),
    );
    expect(idleAfterInvalid).toEqual(initialSimulationState);

    const started = simulationReducer(
      initialSimulationState,
      startSimulation({ baselinePoint }),
    );
    const repeated = simulationReducer(
      started,
      startSimulation({ baselinePoint }),
    );
    expect(repeated).toEqual(started);
    expect(repeated.runId).toBe(1);
  });

  it.each([
    'degrading',
    'incident-created',
    'investigating',
    'recovering',
    'resolved',
  ] as const)('resets immediately from %s', (phase) => {
    const reset = simulationReducer(
      {
        ...reachInvestigating(),
        phase,
      },
      resetSimulation(),
    );

    expect(reset).toMatchObject({
      phase: 'idle',
      appendedMetricPoints: [],
      simulatedIncident: null,
      generatedEvents: [],
      simulatedNotes: [],
      serviceStatusOverride: null,
    });
  });

  it('updates owner, identified status and deterministic notes without changing the run', () => {
    const investigating = reachInvestigating();
    const runId = investigating.runId;
    const owned = simulationReducer(
      investigating,
      assignSimulatedOwner('Maya Chen'),
    );
    expect(owned.simulatedIncident?.owner).toBe('Maya Chen');
    expect(owned.generatedEvents.at(-1)?.type).toBe('owner_changed');

    const identified = simulationReducer(owned, identifySimulatedIncident());
    expect(identified.simulatedIncident?.status).toBe('identified');
    const noted = simulationReducer(
      identified,
      addSimulatedNote({
        author: 'Maya Chen',
        body: 'Provider traffic shifted.',
      }),
    );
    expect(noted.simulatedNotes[0]).toMatchObject({
      id: 'note-simulated-2',
      body: 'Provider traffic shifted.',
    });
    expect(noted.generatedEvents.at(-1)?.type).toBe('note_added');
    expect(noted.runId).toBe(runId);
  });
});
