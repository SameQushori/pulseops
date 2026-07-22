import { baseApi } from '../../../shared/api/baseApi';
import {
  createListResponseSchema,
  type ListResponse,
} from '../../../shared/api/schemas';
import { parseApiResponse } from '../../../shared/api/validation';
import { serviceSchema, type Service } from '../model/service';
import { serviceDetailsResponseSchema } from '../model/serviceDetails';
import type { ServiceDetailsResponse } from '../model/serviceDetails';

const serviceListResponseSchema = createListResponseSchema(serviceSchema);

export const serviceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getServices: build.query<ListResponse<Service>, void>({
      query: () => '/services',
      transformResponse: (response: unknown) =>
        parseApiResponse(serviceListResponseSchema, response),
      providesTags: (result) => [
        { type: 'Service', id: 'LIST' },
        ...(result?.items.map(({ id }) => ({ type: 'Service' as const, id })) ??
          []),
      ],
    }),
    getService: build.query<ServiceDetailsResponse, string>({
      query: (id: string) => `/services/${id}`,
      transformResponse: (response: unknown) =>
        parseApiResponse(serviceDetailsResponseSchema, response),
      providesTags: (_result, _error, id) => [{ type: 'Service', id }],
    }),
  }),
});

export const { useGetServiceQuery, useGetServicesQuery } = serviceApi;
