import type { IncidentEvent } from '../../event/model/incidentEvent';
import type { MetricPoint } from '../../metric/model/metricPoint';
import type { Service } from '../../service/model/service';
import type { Incident } from './incident';
import type { IncidentDetailsResponse } from './incidentDetails';
import type { IncidentNote } from './incidentNote';

export interface IncidentDetailsViewModel {
  incident: Incident;
  service: Service | null;
  serviceName: string;
  timeline: IncidentEvent[];
  notes: IncidentNote[];
  metrics: MetricPoint[];
  source: 'api' | 'simulation';
}

export function sortIncidentTimeline(events: readonly IncidentEvent[]) {
  return [...events].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id),
  );
}

export function sortIncidentNotes(notes: readonly IncidentNote[]) {
  return [...notes].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id),
  );
}

export function adaptApiIncidentDetails(
  details: IncidentDetailsResponse,
  metrics: readonly MetricPoint[] = [],
): IncidentDetailsViewModel {
  return {
    incident: { ...details.incident },
    service: { ...details.service },
    serviceName: details.service.name,
    timeline: sortIncidentTimeline(details.timeline),
    notes: sortIncidentNotes(details.notes),
    metrics: [...metrics],
    source: 'api',
  };
}

interface SimulatedDetailsInput {
  incident: Incident;
  service: Service | null;
  timeline: readonly IncidentEvent[];
  notes: readonly IncidentNote[];
  metrics: readonly MetricPoint[];
}

export function adaptSimulatedIncidentDetails({
  incident,
  metrics,
  notes,
  service,
  timeline,
}: SimulatedDetailsInput): IncidentDetailsViewModel {
  return {
    incident: { ...incident },
    service: service ? { ...service } : null,
    serviceName: service?.name ?? incident.serviceId,
    timeline: sortIncidentTimeline(timeline),
    notes: sortIncidentNotes(notes),
    metrics: [...metrics],
    source: 'simulation',
  };
}
