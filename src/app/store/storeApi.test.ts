import { http, HttpResponse } from 'msw';

import { incidentApi } from '../../entities/incident/api/incidentApi';
import { serviceApi } from '../../entities/service/api/serviceApi';
import { overviewApi } from '../../features/overview-data/api/overviewApi';
import { normalizeApiError } from '../../shared/api/normalizeApiError';
import { mockServer } from '../../shared/api/mocks/server';
import { createAppStore } from './store';

describe('store and RTK Query API', () => {
  it('creates isolated stores with preferences and the RTK Query reducer', () => {
    const first = createAppStore();
    const second = createAppStore();

    expect(first).not.toBe(second);
    expect(Object.keys(first.getState())).toEqual([
      'preferences',
      'simulation',
      'api',
    ]);
    expect(first.getState().preferences.timeRange).toBe('30m');
    expect(first.getState().simulation.phase).toBe('idle');
    expect(first.getState()).not.toBe(second.getState());
  });

  it('returns validated overview, incidents and services data', async () => {
    const store = createAppStore();
    const overview = await store
      .dispatch(overviewApi.endpoints.getOverview.initiate())
      .unwrap();
    const incidents = await store
      .dispatch(incidentApi.endpoints.getIncidents.initiate())
      .unwrap();
    const services = await store
      .dispatch(serviceApi.endpoints.getServices.initiate())
      .unwrap();

    expect(overview.status).toBe('operational');
    expect(incidents.total).toBe(6);
    expect(services.total).toBe(4);
  });

  it('returns a normalizable 404 error for an unknown ID', async () => {
    const store = createAppStore();
    const result = await store.dispatch(
      incidentApi.endpoints.getIncident.initiate('missing'),
    );

    expect(result.isError).toBe(true);
    expect(normalizeApiError(result.error)).toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('rejects malformed success payloads during response validation', async () => {
    mockServer.use(
      http.get('*/api/overview', () =>
        HttpResponse.json({ status: 'operational', services: 'not-an-array' }),
      ),
    );
    const store = createAppStore();
    const result = await store.dispatch(
      overviewApi.endpoints.getOverview.initiate(),
    );

    expect(result.isError).toBe(true);
    expect(normalizeApiError(result.error)).toEqual({
      code: 'INVALID_RESPONSE',
      message: 'The data service returned an invalid response.',
    });
  });
});
