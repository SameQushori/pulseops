import {
  incidentSeveritySchema,
  incidentStatusSchema,
  type IncidentSeverity,
  type IncidentStatus,
} from '../../../entities/incident/model/incident';
import { z } from 'zod';

export const INCIDENT_QUERY_MAX_LENGTH = 120;

export const incidentSortSchema = z.enum(['newest', 'oldest', 'severity']);

export type IncidentSort = z.infer<typeof incidentSortSchema>;

export interface IncidentFiltersState {
  query: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  serviceId?: string;
  sort: IncidentSort;
}

export const defaultIncidentFilters: IncidentFiltersState = {
  query: '',
  sort: 'newest',
};

function parseTrimmedValue(value: string | null, maximumLength?: number) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return undefined;
  return maximumLength ? trimmed.slice(0, maximumLength) : trimmed;
}

export function parseIncidentFilters(
  searchParams: URLSearchParams,
): IncidentFiltersState {
  const status = incidentStatusSchema.safeParse(searchParams.get('status'));
  const severity = incidentSeveritySchema.safeParse(
    searchParams.get('severity'),
  );
  const sort = incidentSortSchema.safeParse(searchParams.get('sort'));
  const serviceId = parseTrimmedValue(searchParams.get('serviceId'));

  return {
    query:
      parseTrimmedValue(searchParams.get('query'), INCIDENT_QUERY_MAX_LENGTH) ??
      '',
    ...(status.success ? { status: status.data } : {}),
    ...(severity.success ? { severity: severity.data } : {}),
    ...(serviceId ? { serviceId } : {}),
    sort: sort.success ? sort.data : 'newest',
  };
}

export function serializeIncidentFilters(filters: IncidentFiltersState) {
  const searchParams = new URLSearchParams();
  const query = parseTrimmedValue(filters.query, INCIDENT_QUERY_MAX_LENGTH);
  const serviceId = parseTrimmedValue(filters.serviceId ?? null);

  if (query) searchParams.set('query', query);
  if (filters.status) searchParams.set('status', filters.status);
  if (filters.severity) searchParams.set('severity', filters.severity);
  if (serviceId) searchParams.set('serviceId', serviceId);
  if (filters.sort !== 'newest') searchParams.set('sort', filters.sort);

  return searchParams;
}

export function updateIncidentFilters(
  filters: IncidentFiltersState,
  patch: Partial<IncidentFiltersState>,
) {
  return parseIncidentFilters(
    serializeIncidentFilters({ ...filters, ...patch }),
  );
}

export function hasActiveIncidentFilters(filters: IncidentFiltersState) {
  return (
    Boolean(
      filters.query || filters.status || filters.severity || filters.serviceId,
    ) || filters.sort !== 'newest'
  );
}

export function countActiveIncidentFilters(filters: IncidentFiltersState) {
  return [
    filters.query,
    filters.status,
    filters.severity,
    filters.serviceId,
    filters.sort !== 'newest' ? filters.sort : undefined,
  ].filter(Boolean).length;
}
