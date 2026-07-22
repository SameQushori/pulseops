import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type {
  Service,
  ServiceStatus,
} from '../../../entities/service/model/service';
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState';
import {
  StatusBadge,
  type StatusBadgeProps,
} from '../../../shared/ui/StatusBadge/StatusBadge';
import {
  formatPercentage,
  formatUtcTimestamp,
} from '../lib/formatOverviewValue';
import styles from '../OverviewPage.module.css';

const statusPresentation: Record<
  ServiceStatus,
  { label: string; tone: StatusBadgeProps['status'] }
> = {
  operational: { label: 'Operational', tone: 'success' },
  degraded: { label: 'Degraded', tone: 'warning' },
  outage: { label: 'Outage', tone: 'critical' },
};

interface ServiceHealthListProps {
  services: Service[];
}

export function ServiceHealthList({ services }: ServiceHealthListProps) {
  return (
    <section className={styles.panel} aria-labelledby="services-health-title">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>Service health</p>
          <h2 id="services-health-title">Monitored services</h2>
        </div>
        <span className={styles.panelCount}>{services.length} total</span>
      </div>

      {services.length === 0 ? (
        <EmptyState
          className={styles.localState}
          title="No services in this snapshot"
          description="Service health will appear here when the environment returns monitored services."
        />
      ) : (
        <ul className={styles.serviceList}>
          {services.map((service) => {
            const status = statusPresentation[service.status];
            return (
              <li key={service.id}>
                <Link
                  className={styles.serviceLink}
                  to={`/app/services/${service.id}`}
                >
                  <div className={styles.serviceIdentity}>
                    <strong>{service.name}</strong>
                    <span>
                      Last deploy {formatUtcTimestamp(service.lastDeployAt)}
                    </span>
                  </div>
                  <StatusBadge label={status.label} status={status.tone} />
                  <dl className={styles.serviceMetrics}>
                    <div>
                      <dt>30d uptime</dt>
                      <dd>{formatPercentage(service.uptime30d)}</dd>
                    </div>
                    <div>
                      <dt>SLO target</dt>
                      <dd>{formatPercentage(service.sloTarget)}</dd>
                    </div>
                  </dl>
                  <ArrowUpRight aria-hidden="true" size={18} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
