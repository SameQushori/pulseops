import { http, HttpResponse } from 'msw';

import { createAppStore } from '../../../app/store/store';
import { incidentsFixture } from '../../../shared/api/mocks/fixtures';
import { mockServer } from '../../../shared/api/mocks/server';
import { incidentApi } from './incidentApi';

function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function seedDetails() {
  const store = createAppStore();
  await store
    .dispatch(
      incidentApi.endpoints.getIncident.initiate('incident-notification-delay'),
    )
    .unwrap();
  return store;
}

function selectDetails(store: Awaited<ReturnType<typeof seedDetails>>) {
  return incidentApi.endpoints.getIncident.select(
    'incident-notification-delay',
  )(store.getState()).data;
}

describe('incident API optimistic cache behavior', () => {
  it('optimistically updates status and keeps the server result', async () => {
    const gate = deferred();
    const store = await seedDetails();
    const current = incidentsFixture.find(
      ({ id }) => id === 'incident-notification-delay',
    );
    if (!current) throw new Error('Fixture missing');
    mockServer.use(
      http.patch('*/api/incidents/:id', async () => {
        await gate.promise;
        return HttpResponse.json({
          ...current,
          status: 'identified',
          updatedAt: '2026-07-19T12:01:00.000Z',
        });
      }),
    );

    const mutation = store.dispatch(
      incidentApi.endpoints.updateIncident.initiate({
        id: current.id,
        changes: { status: 'identified' },
      }),
    );
    expect(selectDetails(store)?.incident.status).toBe('identified');
    expect(selectDetails(store)?.timeline.at(-1)?.type).toBe('status_changed');
    gate.resolve();
    await mutation.unwrap();
    expect(selectDetails(store)?.incident.status).toBe('identified');
  });

  it('rolls status and owner back after failure', async () => {
    const gate = deferred();
    const store = await seedDetails();
    mockServer.use(
      http.patch('*/api/incidents/:id', async () => {
        await gate.promise;
        return HttpResponse.json(
          { error: { code: 'FAILED', message: 'Rejected.' } },
          { status: 500 },
        );
      }),
    );
    const mutation = store.dispatch(
      incidentApi.endpoints.updateIncident.initiate({
        id: 'incident-notification-delay',
        changes: { owner: 'Maya Chen' },
      }),
    );
    expect(selectDetails(store)?.incident.owner).toBe('Maya Chen');
    gate.resolve();
    await expect(mutation.unwrap()).rejects.toBeTruthy();
    expect(selectDetails(store)?.incident.owner).toBeNull();
    expect(
      selectDetails(store)?.timeline.some(({ id }) =>
        id.startsWith('optimistic-'),
      ),
    ).toBe(false);
  });

  it('inserts a temporary note, replaces it on success and removes it on failure', async () => {
    const successGate = deferred();
    const store = await seedDetails();
    mockServer.use(
      http.post('*/api/incidents/:id/notes', async () => {
        await successGate.promise;
        return HttpResponse.json(
          {
            id: 'note-server',
            incidentId: 'incident-notification-delay',
            author: 'Maya Chen',
            body: 'Queue depth declining.',
            createdAt: '2026-07-19T12:02:00.000Z',
          },
          { status: 201 },
        );
      }),
    );
    const success = store.dispatch(
      incidentApi.endpoints.addIncidentNote.initiate({
        id: 'incident-notification-delay',
        note: { author: 'Maya Chen', body: 'Queue depth declining.' },
      }),
    );
    expect(selectDetails(store)?.notes.at(-1)?.id).toMatch(/^temporary-note-/);
    successGate.resolve();
    await success.unwrap();
    expect(
      selectDetails(store)?.notes.filter(
        ({ body }) => body === 'Queue depth declining.',
      ),
    ).toHaveLength(1);

    const failureGate = deferred();
    mockServer.use(
      http.post('*/api/incidents/:id/notes', async () => {
        await failureGate.promise;
        return HttpResponse.json(
          { error: { code: 'FAILED', message: 'Rejected.' } },
          { status: 500 },
        );
      }),
    );
    const failure = store.dispatch(
      incidentApi.endpoints.addIncidentNote.initiate({
        id: 'incident-notification-delay',
        note: { author: 'Maya Chen', body: 'Must roll back.' },
      }),
    );
    expect(
      selectDetails(store)?.notes.some(
        ({ body }) => body === 'Must roll back.',
      ),
    ).toBe(true);
    failureGate.resolve();
    await expect(failure.unwrap()).rejects.toBeTruthy();
    expect(
      selectDetails(store)?.notes.some(
        ({ body }) => body === 'Must roll back.',
      ),
    ).toBe(false);
  });

  it('keeps malformed mutation responses as errors and rolls back', async () => {
    const store = await seedDetails();
    mockServer.use(
      http.patch('*/api/incidents/:id', () =>
        HttpResponse.json({ status: 'identified' }),
      ),
    );
    const result = store.dispatch(
      incidentApi.endpoints.updateIncident.initiate({
        id: 'incident-notification-delay',
        changes: { status: 'identified' },
      }),
    );
    await expect(result.unwrap()).rejects.toBeTruthy();
    expect(selectDetails(store)?.incident.status).toBe('investigating');
  });
});
