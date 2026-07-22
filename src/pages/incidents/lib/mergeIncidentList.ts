import type { Incident } from '../../../entities/incident/model/incident';
import type { IncidentFiltersState } from '../../../features/incident-filters/model/incidentFilters';

const severityOrder = { sev1: 0, sev2: 1, sev3: 2 } as const;

function matchesFilters(incident: Incident, filters: IncidentFiltersState) {
  const query = filters.query.toLowerCase();

  return (
    (!filters.status || incident.status === filters.status) &&
    (!filters.severity || incident.severity === filters.severity) &&
    (!filters.serviceId || incident.serviceId === filters.serviceId) &&
    (!query ||
      incident.title.toLowerCase().includes(query) ||
      incident.summary.toLowerCase().includes(query))
  );
}

function compareIncidents(
  left: Incident,
  right: Incident,
  sort: IncidentFiltersState['sort'],
) {
  let result: number;

  if (sort === 'oldest') {
    result = left.startedAt.localeCompare(right.startedAt);
  } else if (sort === 'severity') {
    result = severityOrder[left.severity] - severityOrder[right.severity];
  } else {
    result = right.startedAt.localeCompare(left.startedAt);
  }

  return result || left.id.localeCompare(right.id);
}

interface MergeIncidentListOptions {
  apiItems: readonly Incident[];
  simulatedIncident: Incident | null;
  filters: IncidentFiltersState;
}

export function mergeIncidentList({
  apiItems,
  simulatedIncident,
  filters,
}: MergeIncidentListOptions) {
  const incidentsById = new Map(
    apiItems.map((incident) => [incident.id, incident] as const),
  );

  if (simulatedIncident && matchesFilters(simulatedIncident, filters)) {
    incidentsById.set(simulatedIncident.id, simulatedIncident);
  }

  return [...incidentsById.values()].sort((left, right) =>
    compareIncidents(left, right, filters.sort),
  );
}
