import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { IncidentEvent } from '../../../entities/event/model/incidentEvent';
import type { Incident } from '../../../entities/incident/model/incident';
import type {
  AddIncidentNoteRequest,
  IncidentNote,
} from '../../../entities/incident/model/incidentNote';
import type { MetricPoint } from '../../../entities/metric/model/metricPoint';
import type { ServiceStatus } from '../../../entities/service/model/service';
import {
  buildSimulatedIdentifiedEvent,
  buildSimulatedNote,
  buildSimulatedOwnerEvent,
} from './simulationScenario';

export type SimulationPhase =
  | 'idle'
  | 'degrading'
  | 'incident-created'
  | 'investigating'
  | 'recovering'
  | 'resolved';

export interface SimulationState {
  phase: SimulationPhase;
  runId: number;
  appendedMetricPoints: MetricPoint[];
  simulatedIncident: Incident | null;
  generatedEvents: IncidentEvent[];
  simulatedNotes: IncidentNote[];
  serviceStatusOverride: ServiceStatus | null;
  progressIndex: number;
  feedbackMessage: string;
  detailMutationIndex: number;
}

export interface StartSimulationPayload {
  baselinePoint: MetricPoint;
}

export const initialSimulationState: SimulationState = {
  phase: 'idle',
  runId: 0,
  appendedMetricPoints: [],
  simulatedIncident: null,
  generatedEvents: [],
  simulatedNotes: [],
  serviceStatusOverride: null,
  progressIndex: 0,
  feedbackMessage: 'The simulated environment is stable.',
  detailMutationIndex: 0,
};

const simulationSlice = createSlice({
  name: 'simulation',
  initialState: initialSimulationState,
  reducers: {
    startSimulation(state, action: PayloadAction<StartSimulationPayload>) {
      if (state.phase !== 'idle') return;
      void action.payload.baselinePoint;
      state.phase = 'degrading';
      state.runId += 1;
      state.appendedMetricPoints = [];
      state.simulatedIncident = null;
      state.generatedEvents = [];
      state.simulatedNotes = [];
      state.serviceStatusOverride = null;
      state.progressIndex = 0;
      state.feedbackMessage = 'Simulation started. Telemetry is degrading.';
    },
    degradationTick(
      state,
      action: PayloadAction<{ point: MetricPoint; index: number }>,
    ) {
      if (state.phase !== 'degrading') return;
      state.appendedMetricPoints.push(action.payload.point);
      state.progressIndex = action.payload.index + 1;
      if (action.payload.index >= 2) {
        state.serviceStatusOverride = 'degraded';
        state.feedbackMessage =
          'Payments API crossed the degradation threshold.';
      }
    },
    incidentCreated(
      state,
      action: PayloadAction<{
        incident: Incident;
        events: IncidentEvent[];
      }>,
    ) {
      if (state.phase !== 'degrading') return;
      state.phase = 'incident-created';
      state.simulatedIncident = action.payload.incident;
      state.generatedEvents.push(...action.payload.events);
      state.feedbackMessage = 'A SEV-2 Payments API incident was created.';
    },
    investigatingEntered(state, action: PayloadAction<IncidentEvent>) {
      if (state.phase !== 'incident-created' || !state.simulatedIncident)
        return;
      state.phase = 'investigating';
      state.simulatedIncident.updatedAt = action.payload.createdAt;
      state.generatedEvents.push(action.payload);
      state.feedbackMessage =
        'Investigation is active. Begin recovery when you are ready.';
    },
    beginRecovery(state, action: PayloadAction<IncidentEvent>) {
      if (state.phase !== 'investigating' || !state.simulatedIncident) return;
      state.phase = 'recovering';
      state.simulatedIncident.status = 'monitoring';
      state.simulatedIncident.updatedAt = action.payload.createdAt;
      state.generatedEvents.push(action.payload);
      state.progressIndex = 0;
      state.feedbackMessage = 'Recovery started. Telemetry is stabilizing.';
    },
    recoveryTick(
      state,
      action: PayloadAction<{ point: MetricPoint; index: number }>,
    ) {
      if (state.phase !== 'recovering') return;
      state.appendedMetricPoints.push(action.payload.point);
      state.progressIndex = action.payload.index + 1;
      if (action.payload.index >= 3) {
        state.serviceStatusOverride = 'operational';
        state.feedbackMessage = 'Payments API has returned to operational.';
      }
    },
    incidentResolved(state, action: PayloadAction<IncidentEvent>) {
      if (state.phase !== 'recovering' || !state.simulatedIncident) return;
      state.phase = 'resolved';
      state.serviceStatusOverride = 'operational';
      state.simulatedIncident.status = 'resolved';
      state.simulatedIncident.resolvedAt = action.payload.createdAt;
      state.simulatedIncident.updatedAt = action.payload.createdAt;
      state.generatedEvents.push(action.payload);
      state.feedbackMessage =
        'Incident resolved. Payments API and telemetry are stable.';
    },
    assignSimulatedOwner(state, action: PayloadAction<string | null>) {
      if (!state.simulatedIncident) return;
      state.detailMutationIndex += 1;
      const event = buildSimulatedOwnerEvent(
        state.simulatedIncident,
        action.payload,
        state.detailMutationIndex,
      );
      state.simulatedIncident.owner = action.payload;
      state.simulatedIncident.updatedAt = event.createdAt;
      state.generatedEvents.push(event);
      state.feedbackMessage = `Owner changed to ${action.payload ?? 'Unassigned'}.`;
    },
    identifySimulatedIncident(state) {
      if (
        state.phase !== 'investigating' ||
        !state.simulatedIncident ||
        state.simulatedIncident.status !== 'investigating'
      )
        return;
      const event = buildSimulatedIdentifiedEvent(state.simulatedIncident);
      state.simulatedIncident.status = 'identified';
      state.simulatedIncident.updatedAt = event.createdAt;
      state.generatedEvents.push(event);
      state.feedbackMessage = 'Incident status changed to identified.';
    },
    addSimulatedNote(state, action: PayloadAction<AddIncidentNoteRequest>) {
      if (!state.simulatedIncident) return;
      state.detailMutationIndex += 1;
      const result = buildSimulatedNote(
        state.simulatedIncident,
        action.payload,
        state.detailMutationIndex,
      );
      state.simulatedNotes.push(result.note);
      state.generatedEvents.push(result.event);
      state.simulatedIncident.updatedAt = result.note.createdAt;
      state.feedbackMessage = 'Incident note added.';
    },
    resetSimulation(state) {
      const nextRunId = state.runId + 1;
      Object.assign(state, initialSimulationState, { runId: nextRunId });
    },
  },
});

export const {
  addSimulatedNote,
  assignSimulatedOwner,
  beginRecovery,
  degradationTick,
  incidentCreated,
  incidentResolved,
  identifySimulatedIncident,
  investigatingEntered,
  recoveryTick,
  resetSimulation,
  startSimulation,
} = simulationSlice.actions;
export const simulationReducer = simulationSlice.reducer;
