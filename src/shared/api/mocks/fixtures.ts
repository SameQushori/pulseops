import { z } from 'zod';

import { incidentEventSchema } from '../../../entities/event/model/incidentEvent';
import { incidentSchema } from '../../../entities/incident/model/incident';
import { incidentNoteSchema } from '../../../entities/incident/model/incidentNote';
import { metricPointSchema } from '../../../entities/metric/model/metricPoint';
import { serviceSchema } from '../../../entities/service/model/service';
import { overviewResponseSchema } from '../../../features/overview-data/model/overview';

export const servicesFixture = z
  .array(serviceSchema)
  .length(4)
  .parse([
    {
      id: 'service-payments',
      name: 'Payments API',
      slug: 'payments-api',
      description: 'Payment authorization and settlement orchestration.',
      status: 'operational',
      sloTarget: 99.95,
      uptime30d: 99.98,
      lastDeployAt: '2026-07-18T14:20:00.000Z',
    },
    {
      id: 'service-checkout',
      name: 'Checkout Web',
      slug: 'checkout-web',
      description: 'Customer checkout experience and order submission.',
      status: 'operational',
      sloTarget: 99.9,
      uptime30d: 99.96,
      lastDeployAt: '2026-07-17T09:15:00.000Z',
    },
    {
      id: 'service-identity',
      name: 'Identity',
      slug: 'identity',
      description: 'Session, token and customer identity services.',
      status: 'operational',
      sloTarget: 99.95,
      uptime30d: 99.99,
      lastDeployAt: '2026-07-16T16:40:00.000Z',
    },
    {
      id: 'service-notifications',
      name: 'Notifications',
      slug: 'notifications',
      description: 'Transactional message delivery and status callbacks.',
      status: 'operational',
      sloTarget: 99.5,
      uptime30d: 99.88,
      lastDeployAt: '2026-07-15T11:05:00.000Z',
    },
  ]);

export const serviceDependencyIds: Readonly<Record<string, readonly string[]>> =
  {
    'service-checkout': ['service-payments', 'service-identity'],
    'service-payments': ['service-identity'],
    'service-notifications': ['service-identity'],
    'service-identity': [],
  };

export function getServiceDependencies(serviceId: string) {
  const dependencyIds = serviceDependencyIds[serviceId] ?? [];
  return dependencyIds.map((dependencyId) => {
    const dependency = servicesFixture.find(({ id }) => id === dependencyId);
    if (!dependency) {
      throw new Error(
        `Missing service fixture for dependency ${dependencyId}.`,
      );
    }
    return dependency;
  });
}

export const incidentsFixture = z
  .array(incidentSchema)
  .length(6)
  .parse([
    {
      id: 'incident-payments-latency',
      title: 'Elevated payment authorization latency',
      summary:
        'A provider timeout increased authorization latency in one region.',
      serviceId: 'service-payments',
      severity: 'sev2',
      status: 'resolved',
      owner: 'Maya Chen',
      startedAt: '2026-07-12T08:30:00.000Z',
      resolvedAt: '2026-07-12T09:18:00.000Z',
      createdAt: '2026-07-12T08:34:00.000Z',
      updatedAt: '2026-07-12T09:18:00.000Z',
    },
    {
      id: 'incident-checkout-errors',
      title: 'Checkout submission errors',
      summary:
        'A frontend deployment caused intermittent order submission failures.',
      serviceId: 'service-checkout',
      severity: 'sev1',
      status: 'monitoring',
      owner: 'Noah Williams',
      startedAt: '2026-07-18T18:05:00.000Z',
      resolvedAt: null,
      createdAt: '2026-07-18T18:07:00.000Z',
      updatedAt: '2026-07-18T18:42:00.000Z',
    },
    {
      id: 'incident-identity-tokens',
      title: 'Token refresh degradation',
      summary:
        'Refresh requests exceeded the latency objective during cache warming.',
      serviceId: 'service-identity',
      severity: 'sev3',
      status: 'identified',
      owner: 'Priya Shah',
      startedAt: '2026-07-17T12:10:00.000Z',
      resolvedAt: null,
      createdAt: '2026-07-17T12:16:00.000Z',
      updatedAt: '2026-07-17T12:35:00.000Z',
    },
    {
      id: 'incident-notification-delay',
      title: 'Delayed transactional notifications',
      summary:
        'Queue depth delayed delivery confirmations for a subset of messages.',
      serviceId: 'service-notifications',
      severity: 'sev3',
      status: 'investigating',
      owner: null,
      startedAt: '2026-07-19T06:20:00.000Z',
      resolvedAt: null,
      createdAt: '2026-07-19T06:25:00.000Z',
      updatedAt: '2026-07-19T06:25:00.000Z',
    },
    {
      id: 'incident-checkout-assets',
      title: 'Checkout asset cache misses',
      summary: 'A CDN configuration increased static asset response time.',
      serviceId: 'service-checkout',
      severity: 'sev2',
      status: 'resolved',
      owner: 'Elena Rossi',
      startedAt: '2026-07-08T15:00:00.000Z',
      resolvedAt: '2026-07-08T15:31:00.000Z',
      createdAt: '2026-07-08T15:03:00.000Z',
      updatedAt: '2026-07-08T15:31:00.000Z',
    },
    {
      id: 'incident-identity-login',
      title: 'Login rate limit saturation',
      summary: 'Unexpected retry traffic saturated a shared login rate limit.',
      serviceId: 'service-identity',
      severity: 'sev1',
      status: 'resolved',
      owner: 'Priya Shah',
      startedAt: '2026-07-03T20:40:00.000Z',
      resolvedAt: '2026-07-03T21:22:00.000Z',
      createdAt: '2026-07-03T20:42:00.000Z',
      updatedAt: '2026-07-03T21:22:00.000Z',
    },
  ]);

export const metricPointsFixture = z.array(metricPointSchema).parse([
  {
    timestamp: '2026-07-19T00:00:00.000Z',
    latencyMs: 136,
    errorRate: 0.14,
    throughput: 1268,
  },
  {
    timestamp: '2026-07-19T00:30:00.000Z',
    latencyMs: 139,
    errorRate: 0.15,
    throughput: 1284,
  },
  {
    timestamp: '2026-07-19T01:00:00.000Z',
    latencyMs: 141,
    errorRate: 0.17,
    throughput: 1292,
  },
  {
    timestamp: '2026-07-19T01:30:00.000Z',
    latencyMs: 137,
    errorRate: 0.14,
    throughput: 1301,
  },
  {
    timestamp: '2026-07-19T02:00:00.000Z',
    latencyMs: 143,
    errorRate: 0.18,
    throughput: 1279,
  },
  {
    timestamp: '2026-07-19T02:30:00.000Z',
    latencyMs: 140,
    errorRate: 0.16,
    throughput: 1310,
  },
  {
    timestamp: '2026-07-19T03:00:00.000Z',
    latencyMs: 144,
    errorRate: 0.19,
    throughput: 1296,
  },
  {
    timestamp: '2026-07-19T03:30:00.000Z',
    latencyMs: 138,
    errorRate: 0.15,
    throughput: 1320,
  },
  {
    timestamp: '2026-07-19T04:00:00.000Z',
    latencyMs: 146,
    errorRate: 0.2,
    throughput: 1288,
  },
  {
    timestamp: '2026-07-19T04:30:00.000Z',
    latencyMs: 141,
    errorRate: 0.17,
    throughput: 1325,
  },
  {
    timestamp: '2026-07-19T05:00:00.000Z',
    latencyMs: 142,
    errorRate: 0.18,
    throughput: 1280,
  },
  {
    timestamp: '2026-07-19T05:30:00.000Z',
    latencyMs: 138,
    errorRate: 0.16,
    throughput: 1315,
  },
  {
    timestamp: '2026-07-19T06:00:00.000Z',
    latencyMs: 147,
    errorRate: 0.21,
    throughput: 1304,
  },
]);

export const incidentEventsFixture = z.array(incidentEventSchema).parse([
  {
    id: 'event-notification-alert',
    incidentId: 'incident-notification-delay',
    type: 'metric_alert',
    message: 'Delivery delay exceeded the warning threshold.',
    createdAt: '2026-07-19T06:20:00.000Z',
  },
  {
    id: 'event-notification-created',
    incidentId: 'incident-notification-delay',
    type: 'created',
    message: 'Incident created from queue delay alert.',
    createdAt: '2026-07-19T06:25:00.000Z',
  },
  {
    id: 'event-checkout-created',
    incidentId: 'incident-checkout-errors',
    type: 'created',
    message: 'Incident created after checkout error-rate alert.',
    createdAt: '2026-07-18T18:07:00.000Z',
  },
  {
    id: 'event-checkout-status',
    incidentId: 'incident-checkout-errors',
    type: 'status_changed',
    message: 'Status changed to monitoring after rollback.',
    createdAt: '2026-07-18T18:42:00.000Z',
  },
  {
    id: 'event-payments-created',
    incidentId: 'incident-payments-latency',
    type: 'created',
    message: 'Incident created after regional latency alert.',
    createdAt: '2026-07-12T08:34:00.000Z',
  },
  {
    id: 'event-payments-resolved',
    incidentId: 'incident-payments-latency',
    type: 'status_changed',
    message: 'Status changed to resolved.',
    createdAt: '2026-07-12T09:18:00.000Z',
  },
]);

export const incidentNotesFixture = z.array(incidentNoteSchema).parse([
  {
    id: 'note-payments-1',
    incidentId: 'incident-payments-latency',
    author: 'Maya Chen',
    body: 'Traffic was shifted away from the affected provider region.',
    createdAt: '2026-07-12T08:51:00.000Z',
  },
  {
    id: 'note-checkout-1',
    incidentId: 'incident-checkout-errors',
    author: 'Noah Williams',
    body: 'Rollback completed; error rate is returning to baseline.',
    createdAt: '2026-07-18T18:38:00.000Z',
  },
]);

export const overviewFixture = overviewResponseSchema.parse({
  status: 'operational',
  kpis: {
    latencyMs: 147,
    errorRate: 0.21,
    throughput: 1304,
    activeIncidents: 3,
  },
  services: servicesFixture,
  metrics: metricPointsFixture,
  recentEvents: incidentEventsFixture.slice(0, 4),
});
