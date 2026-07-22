import { useMemo } from 'react';

import { useAppSelector } from '../../app/store/hooks';
import { useGetServicesQuery } from '../../entities/service/api/serviceApi';
import { getServiceStatusBreakdown } from '../../entities/service/model/servicePresentation';
import { applyServiceStatusOverlay } from '../../features/incident-simulation/lib/serviceSimulationOverlay';
import { selectSimulation } from '../../features/incident-simulation/model/simulationSelectors';
import { normalizeApiError } from '../../shared/api/normalizeApiError';
import { Button } from '../../shared/ui/Button/Button';
import { EmptyState } from '../../shared/ui/EmptyState/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState/ErrorState';
import { ServiceCard } from './components/ServiceCard';
import { ServicesSkeleton } from './components/ServicesSkeleton';
import styles from './ServicesPage.module.css';

export function ServicesPage() {
  const query = useGetServicesQuery();
  const simulation = useAppSelector(selectSimulation);
  const services = useMemo(
    () => applyServiceStatusOverlay(query.data?.items ?? [], simulation),
    [query.data?.items, simulation],
  );
  const breakdown = getServiceStatusBreakdown(services);

  if (query.isLoading) return <ServicesSkeleton />;

  return (
    <section className={styles.page} aria-labelledby="services-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Service catalog</p>
          <h1 id="services-title">Services</h1>
          <p className={styles.description}>
            Reliability objectives, deployment recency and current health for
            the monitored PulseOps service boundary.
          </p>
        </div>
        <div className={styles.summary} aria-label="Service status summary">
          <strong>{services.length} monitored services</strong>
          <span>
            {breakdown.operational} operational · {breakdown.degraded} degraded
            · {breakdown.outage} outage
          </span>
        </div>
      </header>

      {query.error ? (
        <ErrorState
          title="Services unavailable"
          description={normalizeApiError(query.error).message}
          action={
            <Button onClick={() => void query.refetch()}>Retry request</Button>
          }
        />
      ) : services.length === 0 ? (
        <EmptyState
          title="No services configured"
          description="This environment has not returned any monitored services."
        />
      ) : (
        <ul className={styles.grid} aria-label="Monitored services">
          {services.map((service) => (
            <li key={service.id}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
