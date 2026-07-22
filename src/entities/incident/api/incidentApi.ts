import { baseApi } from '../../../shared/api/baseApi';
import {
  createListResponseSchema,
  type ListResponse,
} from '../../../shared/api/schemas';
import { parseApiResponse } from '../../../shared/api/validation';
import {
  incidentSchema,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
  type UpdateIncidentRequest,
} from '../model/incident';
import { incidentDetailsResponseSchema } from '../model/incidentDetails';
import type { IncidentDetailsResponse } from '../model/incidentDetails';
import {
  incidentNoteSchema,
  type IncidentNote,
  type AddIncidentNoteRequest,
} from '../model/incidentNote';

export interface IncidentsQueryParams {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  serviceId?: string;
  query?: string;
  sort?: 'newest' | 'oldest' | 'severity';
}

function buildIncidentsSearch(params: IncidentsQueryParams) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.severity) search.set('severity', params.severity);
  if (params.serviceId) search.set('serviceId', params.serviceId);
  if (params.query) search.set('query', params.query);
  if (params.sort) search.set('sort', params.sort);
  const query = search.toString();
  return query ? `/incidents?${query}` : '/incidents';
}

const incidentListResponseSchema = createListResponseSchema(incidentSchema);

export const incidentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getIncidents: build.query<
      ListResponse<Incident>,
      IncidentsQueryParams | void
    >({
      query: (params: IncidentsQueryParams = {}) =>
        buildIncidentsSearch(params),
      transformResponse: (response: unknown) =>
        parseApiResponse(incidentListResponseSchema, response),
      providesTags: (result) => [
        { type: 'Incident', id: 'LIST' },
        ...(result?.items.map(({ id }) => ({
          type: 'Incident' as const,
          id,
        })) ?? []),
      ],
    }),
    getIncident: build.query<IncidentDetailsResponse, string>({
      query: (id: string) => `/incidents/${id}`,
      transformResponse: (response: unknown) =>
        parseApiResponse(incidentDetailsResponseSchema, response),
      providesTags: (_result, _error, id) => [{ type: 'Incident', id }],
    }),
    updateIncident: build.mutation<
      Incident,
      { id: string; changes: UpdateIncidentRequest }
    >({
      query: ({
        id,
        changes,
      }: {
        id: string;
        changes: UpdateIncidentRequest;
      }) => ({
        url: `/incidents/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      transformResponse: (response: unknown) =>
        parseApiResponse(incidentSchema, response),
      async onQueryStarted({ id, changes }, { dispatch, queryFulfilled }) {
        const changedField = changes.status ? 'status' : 'owner';
        const optimisticTimestamp = '2026-07-19T11:59:59.000Z';
        const patch = dispatch(
          incidentApi.util.updateQueryData('getIncident', id, (draft) => {
            Object.assign(draft.incident, changes, {
              updatedAt: optimisticTimestamp,
              resolvedAt:
                changes.status === 'resolved'
                  ? optimisticTimestamp
                  : draft.incident.resolvedAt,
            });
            draft.timeline.push({
              id: `optimistic-${id}-${changedField}`,
              incidentId: id,
              type: changes.status ? 'status_changed' : 'owner_changed',
              message: changes.status
                ? `Status changing to ${changes.status}.`
                : `Owner changing to ${changes.owner ?? 'Unassigned'}.`,
              createdAt: optimisticTimestamp,
            });
          }),
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(
            incidentApi.util.updateQueryData('getIncident', id, (draft) => {
              draft.incident = data;
            }),
          );
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_result, error, { id }) =>
        error
          ? []
          : [
              { type: 'Incident', id },
              { type: 'Incident', id: 'LIST' },
            ],
    }),
    addIncidentNote: build.mutation<
      IncidentNote,
      { id: string; note: AddIncidentNoteRequest }
    >({
      query: ({ id, note }: { id: string; note: AddIncidentNoteRequest }) => ({
        url: `/incidents/${id}/notes`,
        method: 'POST',
        body: note,
      }),
      transformResponse: (response: unknown) =>
        parseApiResponse(incidentNoteSchema, response),
      async onQueryStarted({ id, note }, { dispatch, queryFulfilled }) {
        const temporaryId = `temporary-note-${id}`;
        const optimisticTimestamp = '2026-07-19T12:04:59.000Z';
        const patch = dispatch(
          incidentApi.util.updateQueryData('getIncident', id, (draft) => {
            draft.notes.push({
              id: temporaryId,
              incidentId: id,
              ...note,
              createdAt: optimisticTimestamp,
            });
            draft.timeline.push({
              id: `optimistic-note-event-${id}`,
              incidentId: id,
              type: 'note_added',
              message: `${note.author} is adding an incident note.`,
              createdAt: optimisticTimestamp,
            });
          }),
        );

        try {
          const { data } = await queryFulfilled;
          dispatch(
            incidentApi.util.updateQueryData('getIncident', id, (draft) => {
              const index = draft.notes.findIndex(
                ({ id: noteId }) => noteId === temporaryId,
              );
              if (index >= 0) draft.notes[index] = data;
            }),
          );
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: (_result, error, { id }) =>
        error ? [] : [{ type: 'Incident', id }],
    }),
  }),
});

export const {
  useAddIncidentNoteMutation,
  useGetIncidentQuery,
  useGetIncidentsQuery,
  useUpdateIncidentMutation,
} = incidentApi;
