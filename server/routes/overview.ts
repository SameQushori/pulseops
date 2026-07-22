import { desc, ne, sql } from 'drizzle-orm';
import { Hono } from 'hono';

import { overviewResponseSchema } from '../../src/features/overview-data/model/overview';
import { createDatabase } from '../db/client';
import { mapIncidentEvent, mapMetricPoint, mapService } from '../db/mappers';
import {
  incidentEvents,
  incidents,
  metricSnapshots,
  services,
} from '../db/schema';
import type { AppEnv } from '../env';
import { parseResponse } from '../lib/validation';

export const overviewRoutes = new Hono<AppEnv>().get('/', async (context) => {
  const db = createDatabase(context.env.DB);
  const [serviceRows, metricRows, eventRows, activeRows] = await Promise.all([
    db
      .select()
      .from(services)
      .orderBy(
        sql`case ${services.id}
          when 'service-payments' then 0
          when 'service-checkout' then 1
          when 'service-identity' then 2
          else 3
        end`,
        services.id,
      ),
    db
      .select()
      .from(metricSnapshots)
      .orderBy(metricSnapshots.timestamp, metricSnapshots.id),
    db
      .select()
      .from(incidentEvents)
      .orderBy(desc(incidentEvents.createdAt), desc(incidentEvents.id))
      .limit(4),
    db
      .select({ id: incidents.id })
      .from(incidents)
      .where(ne(incidents.status, 'resolved')),
  ]);
  const serviceItems = serviceRows.map(mapService);
  const metrics = metricRows.map(mapMetricPoint);
  const latest = metrics.at(-1);
  if (!latest) throw new Error('Metric baseline is empty.');
  const status = serviceItems.some(({ status }) => status === 'outage')
    ? 'outage'
    : serviceItems.some(({ status }) => status === 'degraded')
      ? 'degraded'
      : 'operational';

  return context.json(
    parseResponse(overviewResponseSchema, {
      status,
      kpis: {
        latencyMs: latest.latencyMs,
        errorRate: latest.errorRate,
        throughput: latest.throughput,
        activeIncidents: activeRows.length,
      },
      services: serviceItems,
      metrics,
      recentEvents: eventRows.map(mapIncidentEvent),
    }),
  );
});
