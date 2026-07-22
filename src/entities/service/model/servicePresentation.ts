import type { Service, ServiceStatus } from './service';

export const serviceStatusPresentation = {
  operational: { label: 'Operational', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  outage: { label: 'Outage', tone: 'critical' },
} as const satisfies Record<
  ServiceStatus,
  { label: string; tone: 'success' | 'warning' | 'critical' }
>;

export function isMeetingSlo(
  service: Pick<Service, 'sloTarget' | 'uptime30d'>,
) {
  return service.uptime30d >= service.sloTarget;
}

export function getServiceStatusBreakdown(services: readonly Service[]) {
  return services.reduce(
    (breakdown, service) => ({
      ...breakdown,
      [service.status]: breakdown[service.status] + 1,
    }),
    { operational: 0, degraded: 0, outage: 0 },
  );
}

const percentageFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const utcFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export const formatServicePercentage = (value: number) =>
  `${percentageFormatter.format(value)}%`;

export const formatServiceUtcTimestamp = (value: string) =>
  `${utcFormatter.format(new Date(value))} UTC`;
