import type { IncidentStatus } from './incident';

const transitions: Record<IncidentStatus, readonly IncidentStatus[]> = {
  investigating: ['identified', 'monitoring'],
  identified: ['monitoring'],
  monitoring: ['resolved'],
  resolved: [],
};

export function getAllowedIncidentStatuses(status: IncidentStatus) {
  return [...transitions[status]];
}

export const INCIDENT_OWNERS = [
  'Maya Chen',
  'Noah Williams',
  'Priya Shah',
] as const;
