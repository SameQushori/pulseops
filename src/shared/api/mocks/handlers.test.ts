import { http, HttpResponse } from 'msw';
import { z, type ZodType } from 'zod';

import { incidentSchema } from '../../../entities/incident/model/incident';
import { incidentDetailsResponseSchema } from '../../../entities/incident/model/incidentDetails';
import { incidentNoteSchema } from '../../../entities/incident/model/incidentNote';
import { serviceSchema } from '../../../entities/service/model/service';
import { serviceDetailsResponseSchema } from '../../../entities/service/model/serviceDetails';
import { apiErrorSchema, createListResponseSchema } from '../schemas';
import { mockServer } from './server';

const apiUrl = (path: string) => `http://localhost/api${path}`;
const incidentListSchema = createListResponseSchema(incidentSchema);
const serviceListSchema = createListResponseSchema(serviceSchema);

async function parseJson<T>(response: Response, schema: ZodType<T>) {
  const payload: unknown = await response.json();
  return schema.parse(payload);
}

describe('MSW API contract', () => {
  it.each([
    ['/health', 200],
    ['/overview', 200],
    ['/incidents', 200],
    ['/incidents/incident-payments-latency', 200],
    ['/services', 200],
    ['/services/service-payments', 200],
  ])('serves GET %s', async (path, status) => {
    const response = await fetch(apiUrl(path));
    expect(response.status).toBe(status);
  });

  it('returns the expected list totals', async () => {
    const incidents = await parseJson(
      await fetch(apiUrl('/incidents')),
      incidentListSchema,
    );
    const services = await parseJson(
      await fetch(apiUrl('/services')),
      serviceListSchema,
    );

    expect(incidents).toMatchObject({ total: 6 });
    expect(services).toMatchObject({ total: 4 });
  });

  it('returns validated direct dependencies for service details', async () => {
    const checkout = await parseJson(
      await fetch(apiUrl('/services/service-checkout')),
      serviceDetailsResponseSchema,
    );
    const identity = await parseJson(
      await fetch(apiUrl('/services/service-identity')),
      serviceDetailsResponseSchema,
    );
    expect(checkout.dependencies.map(({ id }) => id)).toEqual([
      'service-payments',
      'service-identity',
    ]);
    expect(identity.dependencies).toEqual([]);
  });

  it('filters incidents by status, severity, service and query', async () => {
    const status = await parseJson(
      await fetch(apiUrl('/incidents?status=resolved')),
      incidentListSchema,
    );
    const severity = await parseJson(
      await fetch(apiUrl('/incidents?severity=sev1')),
      incidentListSchema,
    );
    const service = await parseJson(
      await fetch(apiUrl('/incidents?serviceId=service-checkout')),
      incidentListSchema,
    );
    const query = await parseJson(
      await fetch(apiUrl('/incidents?query=token')),
      incidentListSchema,
    );

    expect(status.total).toBe(3);
    expect(severity.total).toBe(2);
    expect(service.total).toBe(2);
    expect(query.total).toBe(1);
  });

  it('sorts incidents by oldest and severity', async () => {
    const oldest = await parseJson(
      await fetch(apiUrl('/incidents?sort=oldest')),
      incidentListSchema,
    );
    const severity = await parseJson(
      await fetch(apiUrl('/incidents?sort=severity')),
      incidentListSchema,
    );

    expect(oldest.items[0].id).toBe('incident-identity-login');
    expect(severity.items[0].severity).toBe('sev1');
  });

  it.each([
    '?status=closed',
    '?severity=sev4',
    '?sort=random',
    `?query=${'a'.repeat(121)}`,
  ])('rejects invalid incident query %s', async (query) => {
    const response = await fetch(apiUrl(`/incidents${query}`));
    expect(response.status).toBe(422);
    expect(await parseJson(response, apiErrorSchema)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('returns common 404 errors for unknown entities', async () => {
    const incident = await fetch(apiUrl('/incidents/missing'));
    const service = await fetch(apiUrl('/services/missing'));

    expect(incident.status).toBe(404);
    expect(await parseJson(incident, apiErrorSchema)).toMatchObject({
      error: { code: 'NOT_FOUND' },
    });
    expect(service.status).toBe(404);
    expect(await parseJson(service, apiErrorSchema)).toMatchObject({
      error: { code: 'NOT_FOUND' },
    });
  });

  it('updates incident status and owner', async () => {
    const response = await fetch(
      apiUrl('/incidents/incident-notification-delay'),
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'identified', owner: 'Maya Chen' }),
      },
    );
    const incident = await parseJson(response, incidentSchema);

    expect(response.status).toBe(200);
    expect(incident).toMatchObject({
      status: 'identified',
      owner: 'Maya Chen',
    });
    const details = await parseJson(
      await fetch(apiUrl('/incidents/incident-notification-delay')),
      incidentDetailsResponseSchema,
    );
    expect(details.timeline.some(({ type }) => type === 'status_changed')).toBe(
      true,
    );
    expect(details.timeline.some(({ type }) => type === 'owner_changed')).toBe(
      true,
    );
  });

  it('rejects an empty incident update', async () => {
    const response = await fetch(
      apiUrl('/incidents/incident-notification-delay'),
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    );

    expect(response.status).toBe(422);
    const error = await parseJson(response, apiErrorSchema);
    expect(error.error.code).toBe('VALIDATION_ERROR');
    expect(error.error.fieldErrors?.request).toBeTruthy();
  });

  it('returns 400 for malformed mutation JSON', async () => {
    const response = await fetch(
      apiUrl('/incidents/incident-notification-delay'),
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      },
    );
    expect(response.status).toBe(400);
    expect(await parseJson(response, apiErrorSchema)).toMatchObject({
      error: { code: 'MALFORMED_JSON' },
    });
  });

  it('adds a validated incident note', async () => {
    const response = await fetch(
      apiUrl('/incidents/incident-notification-delay/notes'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: 'Maya Chen',
          body: 'Queue depth is declining.',
        }),
      },
    );
    const note = await parseJson(response, incidentNoteSchema);

    expect(response.status).toBe(201);
    expect(note).toMatchObject({
      incidentId: 'incident-notification-delay',
      author: 'Maya Chen',
    });
    const details = await parseJson(
      await fetch(apiUrl('/incidents/incident-notification-delay')),
      incidentDetailsResponseSchema,
    );
    expect(
      details.notes.filter(({ body }) => body === 'Queue depth is declining.'),
    ).toHaveLength(1);
    expect(details.timeline.some(({ type }) => type === 'note_added')).toBe(
      true,
    );
  });

  it('rejects an invalid incident note', async () => {
    const response = await fetch(
      apiUrl('/incidents/incident-notification-delay/notes'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'M', body: '' }),
      },
    );

    expect(response.status).toBe(422);
    expect(await parseJson(response, apiErrorSchema)).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('resets mutable mock state between tests', async () => {
    const incident = await parseJson(
      await fetch(apiUrl('/incidents/incident-notification-delay')),
      incidentDetailsResponseSchema,
    );
    expect(incident.incident).toMatchObject({
      status: 'investigating',
      owner: null,
    });
  });

  it('allows a test to replace a handler explicitly', async () => {
    mockServer.use(
      http.get('*/api/health', () =>
        HttpResponse.json({ status: 'maintenance' }),
      ),
    );
    expect(
      await parseJson(
        await fetch(apiUrl('/health')),
        z.object({ status: z.literal('maintenance') }),
      ),
    ).toEqual({ status: 'maintenance' });
  });
});
