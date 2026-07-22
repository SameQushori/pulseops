import { z, type ZodType } from 'zod';
import { describe, expect, it } from 'vitest';

import { incidentSchema } from '../src/entities/incident/model/incident';
import { incidentDetailsResponseSchema } from '../src/entities/incident/model/incidentDetails';
import { incidentNoteSchema } from '../src/entities/incident/model/incidentNote';
import { serviceDetailsResponseSchema } from '../src/entities/service/model/serviceDetails';
import { serviceSchema } from '../src/entities/service/model/service';
import { overviewResponseSchema } from '../src/features/overview-data/model/overview';
import {
  apiErrorSchema,
  createListResponseSchema,
  healthResponseSchema,
} from '../src/shared/api/schemas';

const baseUrl = process.env.API_BASE_URL;
if (!baseUrl)
  throw new Error('API_BASE_URL is required for API integration tests.');

const incidentListSchema = createListResponseSchema(incidentSchema);
const serviceListSchema = createListResponseSchema(serviceSchema);

async function request(path: string, init?: RequestInit) {
  return fetch(`${baseUrl}/api${path}`, init);
}

async function parse<T>(response: Response, schema: ZodType<T>) {
  const payload: unknown = await response.json();
  return schema.parse(payload);
}

describe('real Pages Functions + Hono + D1 API', () => {
  it('reports health only with an available D1 binding', async () => {
    const response = await request('/health');
    expect(response.status).toBe(200);
    expect(await parse(response, healthResponseSchema)).toEqual({
      status: 'ok',
    });
  });

  it('returns the validated deterministic overview baseline', async () => {
    const overview = await parse(
      await request('/overview'),
      overviewResponseSchema,
    );
    expect(overview).toMatchObject({
      status: 'operational',
      kpis: {
        latencyMs: 147,
        errorRate: 0.21,
        throughput: 1304,
        activeIncidents: 3,
      },
    });
    expect(overview.services).toHaveLength(4);
    expect(overview.metrics).toHaveLength(13);
    expect(overview.recentEvents).toHaveLength(4);
  });

  it('lists, filters and searches all six incidents', async () => {
    const baseline = await parse(
      await request('/incidents'),
      incidentListSchema,
    );
    const status = await parse(
      await request('/incidents?status=resolved'),
      incidentListSchema,
    );
    const severity = await parse(
      await request('/incidents?severity=sev1'),
      incidentListSchema,
    );
    const service = await parse(
      await request('/incidents?serviceId=service-checkout'),
      incidentListSchema,
    );
    const search = await parse(
      await request('/incidents?query=%20ToKeN%20'),
      incidentListSchema,
    );

    expect(baseline.total).toBe(6);
    expect(baseline.items[0]?.id).toBe('incident-notification-delay');
    expect(status.total).toBe(3);
    expect(severity.total).toBe(2);
    expect(service.total).toBe(2);
    expect(search.items.map(({ id }) => id)).toEqual([
      'incident-identity-tokens',
    ]);
  });

  it('implements newest, oldest and severity sorting with stable ties', async () => {
    const newest = await parse(
      await request('/incidents?sort=newest'),
      incidentListSchema,
    );
    const oldest = await parse(
      await request('/incidents?sort=oldest'),
      incidentListSchema,
    );
    const severity = await parse(
      await request('/incidents?sort=severity'),
      incidentListSchema,
    );
    expect(newest.items[0]?.id).toBe('incident-notification-delay');
    expect(oldest.items[0]?.id).toBe('incident-identity-login');
    expect(severity.items.map(({ severity }) => severity)).toEqual([
      'sev1',
      'sev1',
      'sev2',
      'sev2',
      'sev3',
      'sev3',
    ]);
  });

  it.each([
    '/incidents?status=closed',
    '/incidents?severity=sev4',
    '/incidents?sort=random',
    `/incidents?query=${'a'.repeat(121)}`,
  ])('rejects invalid query input with ApiError: %s', async (path) => {
    const response = await request(path);
    expect(response.status).toBe(422);
    expect(await parse(response, apiErrorSchema)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('orders incident timeline and notes chronologically', async () => {
    const details = await parse(
      await request('/incidents/incident-payments-latency'),
      incidentDetailsResponseSchema,
    );
    expect(details.timeline.map(({ createdAt }) => createdAt)).toEqual(
      [...details.timeline]
        .map(({ createdAt }) => createdAt)
        .sort((left, right) => left.localeCompare(right)),
    );
    expect(details.notes).toHaveLength(1);
  });

  it('returns documented 404 errors for unknown entities and routes', async () => {
    for (const path of [
      '/incidents/missing',
      '/services/missing',
      '/missing',
    ]) {
      const response = await request(path);
      expect(response.status).toBe(404);
      expect(await parse(response, apiErrorSchema)).toMatchObject({
        error: { code: 'NOT_FOUND' },
      });
    }
  });

  it('lists services and resolves details by ID and slug', async () => {
    const services = await parse(await request('/services'), serviceListSchema);
    const byId = await parse(
      await request('/services/service-checkout'),
      serviceDetailsResponseSchema,
    );
    const bySlug = await parse(
      await request('/services/checkout-web'),
      serviceDetailsResponseSchema,
    );
    expect(services.total).toBe(4);
    expect(byId).toEqual(bySlug);
    expect(byId.dependencies.map(({ id }) => id)).toEqual([
      'service-payments',
      'service-identity',
    ]);
    expect(byId.incidents.map(({ id }) => id)).toEqual([
      'incident-checkout-errors',
      'incident-checkout-assets',
    ]);
    expect(byId.metrics).toHaveLength(13);
  });

  it('persists status and owner changes with ordered timeline effects', async () => {
    const response = await request('/incidents/incident-notification-delay', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'identified', owner: 'Maya Chen' }),
    });
    expect(response.status).toBe(200);
    expect(await parse(response, incidentSchema)).toMatchObject({
      status: 'identified',
      owner: 'Maya Chen',
    });
    const reloaded = await parse(
      await request('/incidents/incident-notification-delay'),
      incidentDetailsResponseSchema,
    );
    expect(reloaded.incident).toMatchObject({
      status: 'identified',
      owner: 'Maya Chen',
    });
    expect(reloaded.timeline.slice(-2).map(({ type }) => type)).toEqual([
      'status_changed',
      'owner_changed',
    ]);
    expect(
      Date.parse(reloaded.timeline.at(-1)?.createdAt ?? ''),
    ).toBeGreaterThanOrEqual(Date.parse(reloaded.incident.updatedAt));
  });

  it('persists a note and its timeline event', async () => {
    const response = await request(
      '/incidents/incident-notification-delay/notes',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Maya Chen',
          body: 'Queue depth is declining.',
        }),
      },
    );
    expect(response.status).toBe(201);
    const note = await parse(response, incidentNoteSchema);
    expect(note.id).toMatch(/^[0-9a-f-]{36}$/);
    const reloaded = await parse(
      await request('/incidents/incident-notification-delay'),
      incidentDetailsResponseSchema,
    );
    expect(reloaded.notes.some(({ id }) => id === note.id)).toBe(true);
    expect(
      reloaded.timeline.some(
        ({ type, message }) =>
          type === 'note_added' && message.includes('Maya Chen'),
      ),
    ).toBe(true);
  });

  it('distinguishes malformed JSON from schema validation failures', async () => {
    const malformed = await request('/incidents/incident-notification-delay', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    expect(malformed.status).toBe(400);
    expect(await parse(malformed, apiErrorSchema)).toMatchObject({
      error: { code: 'MALFORMED_JSON' },
    });

    for (const [path, body] of [
      ['/incidents/incident-notification-delay', {}],
      [
        '/incidents/incident-notification-delay/notes',
        { author: 'M', body: '' },
      ],
    ] as const) {
      const invalid = await request(path, {
        method: path.endsWith('/notes') ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      expect(invalid.status).toBe(422);
      const error = await parse(invalid, apiErrorSchema);
      expect(error.error.code).toBe('VALIDATION_ERROR');
      expect(error.error.fieldErrors).toBeDefined();
    }
  });

  it('returns safe JSON for unsupported methods', async () => {
    const response = await request('/services', { method: 'POST' });
    expect(response.status).toBe(404);
    expect(await parse(response, apiErrorSchema)).toMatchObject({
      error: { code: 'NOT_FOUND' },
    });
  });

  it('keeps every successful payload on the frontend Zod contract', async () => {
    const checks: Array<[string, ZodType]> = [
      ['/overview', overviewResponseSchema],
      ['/incidents', incidentListSchema],
      ['/incidents/incident-notification-delay', incidentDetailsResponseSchema],
      ['/services', serviceListSchema],
      ['/services/identity', serviceDetailsResponseSchema],
    ];
    for (const [path, schema] of checks) {
      expect(schema.safeParse(await (await request(path)).json()).success).toBe(
        true,
      );
    }
    expect(
      z
        .array(serviceSchema)
        .safeParse(
          (await parse(await request('/services'), serviceListSchema)).items,
        ).success,
    ).toBe(true);
  });
});
