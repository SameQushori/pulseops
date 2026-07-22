import {
  createListenerMiddleware,
  type TypedStartListening,
} from '@reduxjs/toolkit';

import type { AppDispatch, RootState } from '../../../app/store/store';
import {
  buildSimulationScenario,
  DEGRADATION_TICK_MS,
  INCIDENT_TRANSITION_MS,
  RECOVERY_TICK_MS,
} from './simulationScenario';
import {
  beginRecovery,
  degradationTick,
  incidentCreated,
  incidentResolved,
  investigatingEntered,
  recoveryTick,
  resetSimulation,
  startSimulation,
} from './simulationSlice';

export function createSimulationListenerMiddleware() {
  const middleware = createListenerMiddleware();
  const startListening = middleware.startListening as TypedStartListening<
    RootState,
    AppDispatch
  >;

  startListening({
    predicate: (action, currentState, previousState) =>
      resetSimulation.match(action) ||
      (startSimulation.match(action) &&
        previousState.simulation.phase === 'idle' &&
        currentState.simulation.phase === 'degrading'),
    effect: async (action, listenerApi) => {
      listenerApi.cancelActiveListeners();
      if (resetSimulation.match(action) || !startSimulation.match(action))
        return;

      const scenario = buildSimulationScenario(action.payload.baselinePoint);
      const runId = listenerApi.getState().simulation.runId;
      const isCurrentRun = () =>
        listenerApi.getState().simulation.runId === runId;

      for (const [index, point] of scenario.degradationPoints.entries()) {
        await listenerApi.delay(DEGRADATION_TICK_MS);
        if (!isCurrentRun()) return;
        listenerApi.dispatch(degradationTick({ point, index }));
      }

      listenerApi.dispatch(
        incidentCreated({
          incident: scenario.incident,
          events: scenario.incidentCreatedEvents,
        }),
      );
      await listenerApi.delay(INCIDENT_TRANSITION_MS);
      if (!isCurrentRun()) return;
      listenerApi.dispatch(investigatingEntered(scenario.investigatingEvent));

      const recoveryRequested = await listenerApi.condition(
        beginRecovery.match,
      );
      if (!recoveryRequested || !isCurrentRun()) return;

      for (const [index, point] of scenario.recoveryPoints.entries()) {
        await listenerApi.delay(RECOVERY_TICK_MS);
        if (!isCurrentRun()) return;
        listenerApi.dispatch(recoveryTick({ point, index }));
      }

      listenerApi.dispatch(incidentResolved(scenario.resolvedEvent));
    },
  });

  return middleware;
}
