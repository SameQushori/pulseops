import { baseApi } from './baseApi';
import { healthResponseSchema } from './schemas';
import type { HealthResponse } from './schemas';
import { parseApiResponse } from './validation';

export const healthApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getHealth: build.query<HealthResponse, void>({
      query: () => '/health',
      transformResponse: (response: unknown) =>
        parseApiResponse(healthResponseSchema, response),
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;
