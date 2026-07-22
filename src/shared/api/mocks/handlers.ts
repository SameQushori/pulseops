import { delay, http, HttpResponse } from 'msw';
import { z } from 'zod';

import { addIncidentNoteRequestSchema } from '../../../entities/incident/model/incidentNote';
import {
  incidentSeveritySchema,
  incidentStatusSchema,
  updateIncidentRequestSchema,
} from '../../../entities/incident/model/incident';
import {
  INCIDENT_QUERY_MAX_LENGTH,
  incidentSortSchema,
} from '../../../features/incident-filters/model/incidentFilters';
import {
  getServiceDependencies,
  metricPointsFixture,
  overviewFixture,
} from './fixtures';
import { mockDatabase, nextMockMutationIdentity } from './mockDatabase';

const notFound = (entity: 'incident' | 'service') =>
  HttpResponse.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `The requested ${entity} was not found.`,
      },
    },
    { status: 404 },
  );

function validationError(fieldErrors: Record<string, string>) {
  return HttpResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request is invalid.',
        fieldErrors,
      },
    },
    { status: 422 },
  );
}

const severityOrder = { sev1: 0, sev2: 1, sev3: 2 } as const;
const incidentQuerySchema = z.object({
  query: z.string().trim().min(1).max(INCIDENT_QUERY_MAX_LENGTH).optional(),
  status: incidentStatusSchema.optional(),
  severity: incidentSeveritySchema.optional(),
  serviceId: z.string().trim().min(1).max(160).optional(),
  sort: incidentSortSchema.default('newest'),
});

async function readJson(request: Request) {
  try {
    const value: unknown = await request.json();
    return { success: true as const, value };
  } catch {
    return {
      success: false as const,
      response: HttpResponse.json(
        {
          error: {
            code: 'MALFORMED_JSON',
            message: 'The request body must be valid JSON.',
          },
        },
        { status: 400 },
      ),
    };
  }
}

export const handlers = [
  http.get('*/api/health', () => HttpResponse.json({ status: 'ok' })),
  http.get('*/api/overview', async () => {
    await delay(600);
    return HttpResponse.json({
      ...overviewFixture,
      services: mockDatabase.services,
      recentEvents: [...mockDatabase.events]
        .sort(
          (left, right) =>
            right.createdAt.localeCompare(left.createdAt) ||
            right.id.localeCompare(left.id),
        )
        .slice(0, 4),
    });
  }),
  http.get('*/api/incidents', async ({ request }) => {
    await delay(600);
    const url = new URL(request.url);
    const parsedQuery = incidentQuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      severity: url.searchParams.get('severity') ?? undefined,
      serviceId: url.searchParams.get('serviceId') ?? undefined,
      query: url.searchParams.get('query') ?? undefined,
      sort: url.searchParams.get('sort') ?? undefined,
    });
    if (!parsedQuery.success) {
      return validationError(
        Object.fromEntries(
          parsedQuery.error.issues.map((issue) => [
            issue.path.join('.') || 'request',
            issue.message,
          ]),
        ),
      );
    }
    const { status, severity, serviceId, sort } = parsedQuery.data;
    const query = parsedQuery.data.query?.toLowerCase();

    const items = mockDatabase.incidents
      .filter((incident) => !status || incident.status === status)
      .filter((incident) => !severity || incident.severity === severity)
      .filter((incident) => !serviceId || incident.serviceId === serviceId)
      .filter(
        (incident) =>
          !query ||
          incident.title.toLowerCase().includes(query) ||
          incident.summary.toLowerCase().includes(query),
      );
    items.sort((left, right) => {
      let comparison: number;
      if (sort === 'oldest') {
        comparison = left.startedAt.localeCompare(right.startedAt);
      } else if (sort === 'severity') {
        comparison =
          severityOrder[left.severity] - severityOrder[right.severity];
      } else {
        comparison = right.startedAt.localeCompare(left.startedAt);
      }
      return comparison || left.id.localeCompare(right.id);
    });

    return HttpResponse.json({ items, total: items.length });
  }),
  http.get('*/api/incidents/:id', ({ params }) => {
    const incident = mockDatabase.incidents.find(({ id }) => id === params.id);
    if (!incident) return notFound('incident');
    const service = mockDatabase.services.find(
      ({ id }) => id === incident.serviceId,
    );
    if (!service) return notFound('service');

    return HttpResponse.json({
      incident,
      service,
      timeline: mockDatabase.events
        .filter(({ incidentId }) => incidentId === incident.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
      notes: mockDatabase.notes
        .filter(({ incidentId }) => incidentId === incident.id)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    });
  }),
  http.patch('*/api/incidents/:id', async ({ params, request }) => {
    await delay(180);
    const incidentIndex = mockDatabase.incidents.findIndex(
      ({ id }) => id === params.id,
    );
    if (incidentIndex === -1) return notFound('incident');

    const body = await readJson(request);
    if (!body.success) return body.response;
    const parsed = updateIncidentRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      const fieldErrors = Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join('.') || 'request',
          issue.message,
        ]),
      );
      return validationError(fieldErrors);
    }

    const current = mockDatabase.incidents[incidentIndex];
    if (!current) return notFound('incident');
    const identity = nextMockMutationIdentity('event');
    const updated = {
      ...current,
      ...parsed.data,
      updatedAt: identity.timestamp,
      resolvedAt:
        parsed.data.status === 'resolved'
          ? identity.timestamp
          : current.resolvedAt,
    };
    mockDatabase.incidents[incidentIndex] = updated;
    if (parsed.data.status && parsed.data.status !== current.status) {
      mockDatabase.events.push({
        id: identity.id,
        incidentId: current.id,
        type: 'status_changed',
        message: `Status changed to ${parsed.data.status}.`,
        createdAt: identity.timestamp,
      });
    }
    if (
      parsed.data.owner !== undefined &&
      parsed.data.owner !== current.owner
    ) {
      const ownerIdentity = parsed.data.status
        ? nextMockMutationIdentity('event')
        : identity;
      mockDatabase.events.push({
        id: ownerIdentity.id,
        incidentId: current.id,
        type: 'owner_changed',
        message: `Owner changed to ${parsed.data.owner ?? 'Unassigned'}.`,
        createdAt: ownerIdentity.timestamp,
      });
    }
    return HttpResponse.json(updated);
  }),
  http.post('*/api/incidents/:id/notes', async ({ params, request }) => {
    await delay(180);
    const incident = mockDatabase.incidents.find(({ id }) => id === params.id);
    if (!incident) return notFound('incident');

    const body = await readJson(request);
    if (!body.success) return body.response;
    const parsed = addIncidentNoteRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      const fieldErrors = Object.fromEntries(
        parsed.error.issues.map((issue) => [
          issue.path.join('.') || 'request',
          issue.message,
        ]),
      );
      return validationError(fieldErrors);
    }

    const identity = nextMockMutationIdentity('note');
    const note = {
      id: identity.id,
      incidentId: incident.id,
      ...parsed.data,
      createdAt: identity.timestamp,
    };
    mockDatabase.notes.push(note);
    const eventIdentity = nextMockMutationIdentity('event');
    mockDatabase.events.push({
      id: eventIdentity.id,
      incidentId: incident.id,
      type: 'note_added',
      message: `${note.author} added an incident note.`,
      createdAt: eventIdentity.timestamp,
    });
    return HttpResponse.json(note, { status: 201 });
  }),
  http.get('*/api/services', async () => {
    await delay(600);
    const items = [...mockDatabase.services].sort(
      (left, right) =>
        left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
    );
    return HttpResponse.json({
      items,
      total: items.length,
    });
  }),
  http.get('*/api/services/:id', ({ params }) => {
    const service = mockDatabase.services.find(
      ({ id, slug }) => id === params.id || slug === params.id,
    );
    if (!service) return notFound('service');
    return HttpResponse.json({
      service,
      dependencies: getServiceDependencies(service.id),
      incidents: mockDatabase.incidents
        .filter(({ serviceId }) => serviceId === service.id)
        .sort(
          (left, right) =>
            right.startedAt.localeCompare(left.startedAt) ||
            left.id.localeCompare(right.id),
        ),
      metrics: metricPointsFixture,
    });
  }),
];
