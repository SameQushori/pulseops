import { baseApi } from '../../../shared/api/baseApi';
import { parseApiResponse } from '../../../shared/api/validation';
import { overviewResponseSchema } from '../model/overview';
import type { OverviewResponse } from '../model/overview';

export const overviewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOverview: build.query<OverviewResponse, void>({
      query: () => '/overview',
      transformResponse: (response: unknown) =>
        parseApiResponse(overviewResponseSchema, response),
      providesTags: ['Incident', 'Service'],
    }),
  }),
});

export const { useGetOverviewQuery } = overviewApi;
