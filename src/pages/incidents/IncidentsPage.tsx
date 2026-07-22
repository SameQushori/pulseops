import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '../../app/store/hooks';
import {
  useGetIncidentsQuery,
  type IncidentsQueryParams,
} from '../../entities/incident/api/incidentApi';
import { useGetServicesQuery } from '../../entities/service/api/serviceApi';
import {
  defaultIncidentFilters,
  hasActiveIncidentFilters,
  parseIncidentFilters,
  serializeIncidentFilters,
  updateIncidentFilters,
  type IncidentFiltersState,
} from '../../features/incident-filters/model/incidentFilters';
import { IncidentFilters } from '../../features/incident-filters/ui/IncidentFilters';
import { selectSimulatedIncident } from '../../features/incident-simulation/model/simulationSelectors';
import { normalizeApiError } from '../../shared/api/normalizeApiError';
import { Button } from '../../shared/ui/Button/Button';
import { EmptyState } from '../../shared/ui/EmptyState/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState/ErrorState';
import { IncidentsSkeleton } from './components/IncidentsSkeleton';
import { IncidentsTable } from './components/IncidentsTable';
import { mergeIncidentList } from './lib/mergeIncidentList';
import styles from './IncidentsPage.module.css';

function toQueryParams(filters: IncidentFiltersState): IncidentsQueryParams {
  return {
    ...(filters.query ? { query: filters.query } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
    sort: filters.sort,
  };
}

export function IncidentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedFilters = useMemo(
    () => parseIncidentFilters(searchParams),
    [searchParams],
  );
  const servicesQuery = useGetServicesQuery();
  const filters = useMemo(() => {
    if (!parsedFilters.serviceId || !servicesQuery.data) return parsedFilters;
    const hasService = servicesQuery.data.items.some(
      ({ id }) => id === parsedFilters.serviceId,
    );
    return hasService
      ? parsedFilters
      : updateIncidentFilters(parsedFilters, { serviceId: undefined });
  }, [parsedFilters, servicesQuery.data]);
  const queryArgs = useMemo(() => toQueryParams(filters), [filters]);
  const incidentsQuery = useGetIncidentsQuery(queryArgs);
  const simulatedIncident = useAppSelector(selectSimulatedIncident);

  const canonicalSearch = serializeIncidentFilters(filters).toString();
  useEffect(() => {
    if (searchParams.toString() !== canonicalSearch) {
      setSearchParams(canonicalSearch, { replace: true });
    }
  }, [canonicalSearch, searchParams, setSearchParams]);

  const incidents = useMemo(
    () =>
      mergeIncidentList({
        apiItems: incidentsQuery.data?.items ?? [],
        simulatedIncident,
        filters,
      }),
    [filters, incidentsQuery.data?.items, simulatedIncident],
  );
  const serviceNames = useMemo(
    () =>
      new Map(
        servicesQuery.data?.items.map((service) => [
          service.id,
          service.name,
        ]) ?? [],
      ),
    [servicesQuery.data?.items],
  );
  const hasFilters = hasActiveIncidentFilters(filters);
  const isApiEmpty =
    !hasFilters && incidentsQuery.data?.total === 0 && !simulatedIncident;
  const isNoResults =
    hasFilters && incidentsQuery.isSuccess && incidents.length === 0;
  const apiError = incidentsQuery.error
    ? normalizeApiError(incidentsQuery.error)
    : null;

  function applyFilterPatch(patch: Partial<IncidentFiltersState>) {
    setSearchParams(
      serializeIncidentFilters(updateIncidentFilters(filters, patch)),
    );
  }

  return (
    <section className={styles.page} aria-labelledby="incidents-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Response workspace</p>
          <h1 className={styles.title} id="incidents-title">
            Incidents
          </h1>
          <p className={styles.description}>
            Search active response work and review resolved operational history.
          </p>
        </div>
        <p className={styles.resultCount} aria-live="polite">
          {incidentsQuery.error
            ? 'Incident count unavailable'
            : incidentsQuery.isLoading
              ? 'Loading incident count'
              : `Showing ${incidents.length} ${incidents.length === 1 ? 'incident' : 'incidents'}`}
        </p>
      </header>

      <IncidentFilters
        filters={filters}
        onChange={applyFilterPatch}
        onClear={() =>
          setSearchParams(serializeIncidentFilters(defaultIncidentFilters))
        }
        services={servicesQuery.data?.items ?? []}
        serviceState={
          servicesQuery.isLoading
            ? 'loading'
            : servicesQuery.error
              ? 'error'
              : 'ready'
        }
      />

      {incidentsQuery.isLoading ? <IncidentsSkeleton /> : null}

      {apiError ? (
        <ErrorState
          className={styles.statePanel}
          title="Incidents could not be loaded"
          description={apiError.message}
          action={
            <Button
              variant="secondary"
              onClick={() => void incidentsQuery.refetch()}
            >
              Retry request
            </Button>
          }
        />
      ) : null}

      {isApiEmpty ? (
        <EmptyState
          className={styles.statePanel}
          title="No incidents yet"
          description="Start the deterministic demo from Overview to create a client-only incident."
          action={
            <Button asChild variant="secondary">
              <Link to="/app/overview">Go to Overview</Link>
            </Button>
          }
        />
      ) : null}

      {isNoResults ? (
        <EmptyState
          className={styles.statePanel}
          title="No matching incidents"
          description="No incidents match the applied search and filters."
          action={
            <Button
              variant="secondary"
              onClick={() =>
                setSearchParams(
                  serializeIncidentFilters(defaultIncidentFilters),
                )
              }
            >
              Clear filters
            </Button>
          }
        />
      ) : null}

      {!incidentsQuery.isLoading &&
      !apiError &&
      !isApiEmpty &&
      !isNoResults &&
      incidents.length > 0 ? (
        <IncidentsTable
          incidents={incidents}
          serviceNames={serviceNames}
          simulatedIncidentId={simulatedIncident?.id}
        />
      ) : null}
    </section>
  );
}
