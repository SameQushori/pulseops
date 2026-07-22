import type { RootState } from '../../../app/store/store';

export const selectSimulation = (state: RootState) => state.simulation;
export const selectSimulationPhase = (state: RootState) =>
  selectSimulation(state).phase;
export const selectSimulatedIncident = (state: RootState) =>
  selectSimulation(state).simulatedIncident;
export const selectSimulatedNotes = (state: RootState) =>
  selectSimulation(state).simulatedNotes;
export const selectSimulatedTimeline = (state: RootState) =>
  selectSimulation(state).generatedEvents;
export const selectCanStartSimulation = (state: RootState) =>
  selectSimulationPhase(state) === 'idle';
export const selectCanBeginRecovery = (state: RootState) =>
  selectSimulationPhase(state) === 'investigating';
export const selectCanResetSimulation = (state: RootState) =>
  selectSimulationPhase(state) !== 'idle';
export const selectIsSimulationRunning = (state: RootState) =>
  !['idle', 'resolved'].includes(selectSimulationPhase(state));
