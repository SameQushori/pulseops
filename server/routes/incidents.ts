import { and, asc, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import {
  incidentSeveritySchema,
  incidentSchema,
  incidentStatusSchema,
  updateIncidentRequestSchema,
} from '../../src/entities/incident/model/incident';
import { incidentDetailsResponseSchema } from '../../src/entities/incident/model/incidentDetails';
import {
  addIncidentNoteRequestSchema,
  incidentNoteSchema,
} from '../../src/entities/incident/model/incidentNote';
import {
  INCIDENT_QUERY_MAX_LENGTH,
  incidentSortSchema,
} from '../../src/features/incident-filters/model/incidentFilters';
import { createListResponseSchema } from '../../src/shared/api/schemas';
import { createDatabase } from '../db/client';
import {
  mapIncident,
  mapIncidentEvent,
  mapIncidentNote,
  mapService,
} from '../db/mappers';
import {
  incidentEvents,
  incidentNotes,
  incidents,
  services,
} from '../db/schema';
import type { AppEnv } from '../env';
import { notFound } from '../lib/errors';
import { parseInput, parseJson, parseResponse } from '../lib/validation';

const incidentListResponseSchema = createListResponseSchema(incidentSchema);
const incidentIdSchema = z.string().trim().min(1).max(160);
const incidentQuerySchema = z.object({
  query: z.string().trim().min(1).max(INCIDENT_QUERY_MAX_LENGTH).optional(),
  status: incidentStatusSchema.optional(),
  severity: incidentSeveritySchema.optional(),
  serviceId: z.string().trim().min(1).max(160).optional(),
  sort: incidentSortSchema.default('newest'),
});
const severityOrder = sql<number>`case ${incidents.severity}
  when 'sev1' then 0
  when 'sev2' then 1
  else 2
end`;

function mutationTimestamp(offsetMilliseconds = 0) {
  return new Date(Date.now() + offsetMilliseconds).toISOString();
}

export const incidentRoutes = new Hono<AppEnv>()
  .get('/', async (context) => {
    const url = new URL(context.req.url);
    const query = parseInput(incidentQuerySchema, {
      query: url.searchParams.get('query') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      severity: url.searchParams.get('severity') ?? undefined,
      serviceId: url.searchParams.get('serviceId') ?? undefined,
      sort: url.searchParams.get('sort') ?? undefined,
    });
    const conditions: SQL[] = [];
    if (query.status) conditions.push(eq(incidents.status, query.status));
    if (query.severity) conditions.push(eq(incidents.severity, query.severity));
    if (query.serviceId)
      conditions.push(eq(incidents.serviceId, query.serviceId));
    if (query.query) {
      const pattern = `%${query.query.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${incidents.title})`, pattern),
          like(sql`lower(${incidents.summary})`, pattern),
        ) ?? sql`false`,
      );
    }
    const order =
      query.sort === 'oldest'
        ? [asc(incidents.startedAt), asc(incidents.id)]
        : query.sort === 'severity'
          ? [asc(severityOrder), asc(incidents.id)]
          : [desc(incidents.startedAt), asc(incidents.id)];
    const rows = await createDatabase(context.env.DB)
      .select()
      .from(incidents)
      .where(and(...conditions))
      .orderBy(...order);
    const items = rows.map(mapIncident);

    return context.json(
      parseResponse(incidentListResponseSchema, {
        items,
        total: items.length,
      }),
    );
  })
  .get('/:id', async (context) => {
    const id = parseInput(incidentIdSchema, context.req.param('id'));
    const db = createDatabase(context.env.DB);
    const [incidentRow] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1);
    if (!incidentRow) throw notFound('incident');
    const [serviceRow, eventRows, noteRows] = await Promise.all([
      db
        .select()
        .from(services)
        .where(eq(services.id, incidentRow.serviceId))
        .limit(1)
        .then((rows) => rows[0]),
      db
        .select()
        .from(incidentEvents)
        .where(eq(incidentEvents.incidentId, id))
        .orderBy(incidentEvents.createdAt, incidentEvents.id),
      db
        .select()
        .from(incidentNotes)
        .where(eq(incidentNotes.incidentId, id))
        .orderBy(incidentNotes.createdAt, incidentNotes.id),
    ]);
    if (!serviceRow) throw notFound('service');

    return context.json(
      parseResponse(incidentDetailsResponseSchema, {
        incident: mapIncident(incidentRow),
        service: mapService(serviceRow),
        timeline: eventRows.map(mapIncidentEvent),
        notes: noteRows.map(mapIncidentNote),
      }),
    );
  })
  .patch('/:id', async (context) => {
    const id = parseInput(incidentIdSchema, context.req.param('id'));
    const changes = await parseJson(context, updateIncidentRequestSchema);
    const db = createDatabase(context.env.DB);
    const [currentRow] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1);
    if (!currentRow) throw notFound('incident');

    const updatedAt = mutationTimestamp();
    const updatedValues = {
      ...changes,
      updatedAt,
      resolvedAt:
        changes.status === 'resolved' ? updatedAt : currentRow.resolvedAt,
    };
    const updateStatement = db
      .update(incidents)
      .set(updatedValues)
      .where(eq(incidents.id, id));
    const statusChanged =
      changes.status !== undefined && changes.status !== currentRow.status;
    const statusEventStatement = statusChanged
      ? db.insert(incidentEvents).values({
          id: crypto.randomUUID(),
          incidentId: id,
          type: 'status_changed',
          message: `Status changed to ${changes.status}.`,
          createdAt: updatedAt,
        })
      : undefined;
    const ownerChanged =
      changes.owner !== undefined && changes.owner !== currentRow.owner;
    const ownerEventStatement = ownerChanged
      ? db.insert(incidentEvents).values({
          id: crypto.randomUUID(),
          incidentId: id,
          type: 'owner_changed',
          message: `Owner changed to ${changes.owner ?? 'Unassigned'}.`,
          createdAt: mutationTimestamp(statusEventStatement ? 1 : 0),
        })
      : undefined;
    if (statusEventStatement && ownerEventStatement) {
      await db.batch([
        updateStatement,
        statusEventStatement,
        ownerEventStatement,
      ]);
    } else if (statusEventStatement) {
      await db.batch([updateStatement, statusEventStatement]);
    } else if (ownerEventStatement) {
      await db.batch([updateStatement, ownerEventStatement]);
    } else {
      await db.batch([updateStatement]);
    }
    const [updatedRow] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1);
    if (!updatedRow) throw notFound('incident');
    return context.json(parseResponse(incidentSchema, mapIncident(updatedRow)));
  })
  .post('/:id/notes', async (context) => {
    const id = parseInput(incidentIdSchema, context.req.param('id'));
    const input = await parseJson(context, addIncidentNoteRequestSchema);
    const db = createDatabase(context.env.DB);
    const [incidentRow] = await db
      .select({ id: incidents.id })
      .from(incidents)
      .where(eq(incidents.id, id))
      .limit(1);
    if (!incidentRow) throw notFound('incident');

    const createdAt = mutationTimestamp();
    const note = parseResponse(incidentNoteSchema, {
      id: crypto.randomUUID(),
      incidentId: id,
      ...input,
      createdAt,
    });
    await db.batch([
      db.insert(incidentNotes).values(note),
      db.insert(incidentEvents).values({
        id: crypto.randomUUID(),
        incidentId: id,
        type: 'note_added',
        message: `${note.author} added an incident note.`,
        createdAt,
      }),
    ]);
    return context.json(note, 201);
  });
