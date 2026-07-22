import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAppSelector } from '../../app/store/hooks';
import { MetricPerformanceChart } from '../../entities/metric/ui/MetricPerformanceChart/MetricPerformanceChart';
import { useGetServiceQuery } from '../../entities/service/api/serviceApi';
import { serviceStatusPresentation } from '../../entities/service/model/servicePresentation';
import { serializeIncidentFilters } from '../../features/incident-filters/model/incidentFilters';
import { applyServiceDetailsSimulationOverlay } from '../../features/incident-simulation/lib/serviceSimulationOverlay';
import { selectSimulation } from '../../features/incident-simulation/model/simulationSelectors';
import { normalizeApiError } from '../../shared/api/normalizeApiError';
import { Button } from '../../shared/ui/Button/Button';
import { EmptyState } from '../../shared/ui/EmptyState/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState/ErrorState';
import { StatusBadge } from '../../shared/ui/StatusBadge/StatusBadge';
import { DependencyList } from './components/DependencyList';
import { ServiceDetailsSkeleton } from './components/ServiceDetailsSkeleton';
import { ServiceIncidentList } from './components/ServiceIncidentList';
import { ServiceReliability } from './components/ServiceReliability';
import styles from './ServiceDetailsPage.module.css';

export function ServiceDetailsPage() {
  const { serviceId = '' } = useParams();
  const query = useGetServiceQuery(serviceId, { skip: !serviceId });
  const simulation = useAppSelector(selectSimulation);
  const details = useMemo(
    () =>
      query.data
        ? applyServiceDetailsSimulationOverlay(query.data, simulation)
        : null,
    [query.data, simulation],
  );

  if (query.isLoading) return <ServiceDetailsSkeleton />;
  if (!details) {
    const error = normalizeApiError(query.error);
    const notFound = error.code === 'NOT_FOUND';
    return (
      <ErrorState
        headingLevel={1}
        title={notFound ? 'Service not found' : 'Service details unavailable'}
        description={error.message}
        action={
          <div className={styles.stateActions}>
            {notFound ? null : (
              <Button onClick={() => void query.refetch()}>
                Retry request
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link to="/app/services">Return to Services</Link>
            </Button>
          </div>
        }
      />
    );
  }

  const { service } = details;
  const status = serviceStatusPresentation[service.status];
  const incidentSearch = serializeIncidentFilters({
    query: '',
    serviceId: service.id,
    sort: 'newest',
  }).toString();
  const incidentsUrl = `/app/incidents?${incidentSearch}`;

  return (
    <section className={styles.page} aria-labelledby="service-details-title">
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/app/services">Services</Link>
        <span aria-hidden="true">/</span>
        <span>{service.name}</span>
      </nav>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Service reference · {service.slug}</p>
          <h1 id="service-details-title">{service.name}</h1>
          <p className={styles.description}>{service.description}</p>
          <div className={styles.headerBadges}>
            <StatusBadge label={status.label} status={status.tone} />
            {service.hasSimulationOverride ? (
              <span className={styles.simulationMarker}>
                {service.isSimulatedStatus
                  ? 'Simulated degradation'
                  : 'Simulation recovered'}
              </span>
            ) : null}
          </div>
        </div>
        <Link className={styles.relatedLink} to={incidentsUrl}>
          View related incidents
        </Link>
      </header>

      <ServiceReliability service={service} />

      <section
        className={`${styles.panel} ${styles.telemetry}`}
        aria-labelledby="service-telemetry-title"
      >
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Telemetry</p>
            <h2 id="service-telemetry-title">Service telemetry sample</h2>
          </div>
          <span>Latency and error rate · UTC</span>
        </div>
        {details.metrics.length === 0 ? (
          <EmptyState
            title="No service telemetry"
            description="No latency or error-rate points are available for this service."
          />
        ) : (
          <MetricPerformanceChart
            points={details.metrics}
            accessibleLabel={`Service telemetry sample for ${service.name}`}
            description="Deterministic latency and error-rate sample supplied by the service details endpoint; values are shown in UTC."
            fallbackCaption={`Service telemetry sample values for ${service.name}`}
          />
        )}
      </section>

      <div className={styles.detailsGrid}>
        <section className={styles.panel} aria-labelledby="dependencies-title">
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Direct dependencies</p>
              <h2 id="dependencies-title">Depends on</h2>
            </div>
            <span>{details.dependencies.length} direct</span>
          </div>
          <DependencyList dependencies={details.dependencies} />
        </section>
        <section
          className={styles.panel}
          aria-labelledby="service-incidents-title"
        >
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Incident history</p>
              <h2 id="service-incidents-title">Recent incidents</h2>
            </div>
            <Link to={incidentsUrl}>Filtered list</Link>
          </div>
          <ServiceIncidentList incidents={details.incidents} />
        </section>
      </div>
    </section>
  );
}
