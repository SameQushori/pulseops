import type { IncidentStatus } from './incident';

const incidentStatusPresentation = {
  investigating: { label: 'Investigating', tone: 'critical' },
  identified: { label: 'Identified', tone: 'warning' },
  monitoring: { label: 'Monitoring', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'success' },
} as const satisfies Record<
  IncidentStatus,
  { label: string; tone: 'critical' | 'warning' | 'info' | 'success' }
>;

const utcFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function getIncidentStatusPresentation(status: IncidentStatus) {
  return incidentStatusPresentation[status];
}

export function formatIncidentStartedAt(value: string) {
  return `${utcFormatter.format(new Date(value))} UTC`;
}
