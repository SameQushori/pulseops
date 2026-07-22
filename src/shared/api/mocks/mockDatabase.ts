import type { IncidentEvent } from '../../../entities/event/model/incidentEvent';
import type { Incident } from '../../../entities/incident/model/incident';
import type { IncidentNote } from '../../../entities/incident/model/incidentNote';
import type { Service } from '../../../entities/service/model/service';
import {
  incidentEventsFixture,
  incidentNotesFixture,
  incidentsFixture,
  servicesFixture,
} from './fixtures';

interface MockDatabase {
  services: Service[];
  incidents: Incident[];
  events: IncidentEvent[];
  notes: IncidentNote[];
  mutationSequence: number;
}

function createInitialState(): MockDatabase {
  return structuredClone({
    services: servicesFixture,
    incidents: incidentsFixture,
    events: incidentEventsFixture,
    notes: incidentNotesFixture,
    mutationSequence: 0,
  });
}

export const mockDatabase = createInitialState();

export function resetMockDatabase() {
  const initialState = createInitialState();
  mockDatabase.services = initialState.services;
  mockDatabase.incidents = initialState.incidents;
  mockDatabase.events = initialState.events;
  mockDatabase.notes = initialState.notes;
  mockDatabase.mutationSequence = initialState.mutationSequence;
}

export function nextMockMutationIdentity(kind: 'event' | 'note') {
  mockDatabase.mutationSequence += 1;
  const sequence = mockDatabase.mutationSequence;
  return {
    id: `${kind}-session-${sequence}`,
    timestamp: new Date(
      Date.parse('2026-07-19T12:00:00.000Z') + sequence * 60_000,
    ).toISOString(),
  };
}
