import { desc, eq, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { incidentSchema } from '../../src/entities/incident/model/incident';
import { serviceDetailsResponseSchema } from '../../src/entities/service/model/serviceDetails';
import { serviceSchema } from '../../src/entities/service/model/service';
import { createListResponseSchema } from '../../src/shared/api/schemas';
import { createDatabase } from '../db/client';
import { mapIncident, mapMetricPoint, mapService } from '../db/mappers';
import {
  incidents,
  metricSnapshots,
  serviceDependencies,
  services,
} from '../db/schema';
import type { AppEnv } from '../env';
import { notFound } from '../lib/errors';
import { parseInput, parseResponse } from '../lib/validation';

const serviceListResponseSchema = createListResponseSchema(serviceSchema);
const serviceIdSchema = z.string().trim().min(1).max(120);

export const serviceRoutes = new Hono<AppEnv>()
  .get('/', async (context) => {
    const rows = await createDatabase(context.env.DB)
      .select()
      .from(services)
      .orderBy(services.name, services.id);
    return context.json(
      parseResponse(serviceListResponseSchema, {
        items: rows.map(mapService),
        total: rows.length,
      }),
    );
  })
  .get('/:id', async (context) => {
    const identifier = parseInput(serviceIdSchema, context.req.param('id'));
    const db = createDatabase(context.env.DB);
    const [serviceRow] = await db
      .select()
      .from(services)
      .where(or(eq(services.id, identifier), eq(services.slug, identifier)))
      .limit(1);
    if (!serviceRow) throw notFound('service');

    const [dependencyRows, incidentRows, metricRows] = await Promise.all([
      db
        .select({ service: services })
        .from(serviceDependencies)
        .innerJoin(
          services,
          eq(serviceDependencies.dependencyServiceId, services.id),
        )
        .where(eq(serviceDependencies.serviceId, serviceRow.id))
        .orderBy(
          serviceDependencies.sortOrder,
          serviceDependencies.dependencyServiceId,
        ),
      db
        .select()
        .from(incidents)
        .where(eq(incidents.serviceId, serviceRow.id))
        .orderBy(desc(incidents.startedAt), incidents.id),
      db
        .select()
        .from(metricSnapshots)
        .orderBy(metricSnapshots.timestamp, metricSnapshots.id),
    ]);

    return context.json(
      parseResponse(serviceDetailsResponseSchema, {
        service: mapService(serviceRow),
        dependencies: dependencyRows.map(({ service }) => mapService(service)),
        incidents: z.array(incidentSchema).parse(incidentRows.map(mapIncident)),
        metrics: metricRows.map(mapMetricPoint),
      }),
    );
  });
