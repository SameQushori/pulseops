import type { IncidentEvent } from '../../event/model/incidentEvent';
import type { Incident } from './incident';

function parseTimestamp(value: string | null) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function formatIncidentDuration(milliseconds: number | null) {
  if (
    milliseconds === null ||
    milliseconds < 0 ||
    !Number.isFinite(milliseconds)
  ) {
    return 'Not available';
  }
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${totalMinutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function calculateIncidentResponseMetrics(
  incident: Incident,
  timeline: readonly IncidentEvent[],
) {
  const startedAt = parseTimestamp(incident.startedAt);
  const acknowledgedAt = [...timeline]
    .filter((event) => ['status_changed', 'owner_changed'].includes(event.type))
    .map((event) => parseTimestamp(event.createdAt))
    .filter((timestamp): timestamp is number => timestamp !== null)
    .filter((timestamp) => startedAt !== null && timestamp >= startedAt)
    .sort((left, right) => left - right)[0];
  const resolvedAt = parseTimestamp(incident.resolvedAt);

  return {
    mtta:
      startedAt !== null && acknowledgedAt !== undefined
        ? acknowledgedAt - startedAt
        : null,
    mttr:
      startedAt !== null && resolvedAt !== null ? resolvedAt - startedAt : null,
  };
}
