import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ServiceWithSimulation } from '../../../features/incident-simulation/lib/serviceSimulationOverlay';
import {
  formatServicePercentage,
  formatServiceUtcTimestamp,
  isMeetingSlo,
  serviceStatusPresentation,
} from '../../../entities/service/model/servicePresentation';
import { StatusBadge } from '../../../shared/ui/StatusBadge/StatusBadge';
import { BorderGlow } from '../../../shared/ui/react-bits/BorderGlow/BorderGlow';
import styles from '../ServicesPage.module.css';

interface ServiceCardProps {
  service: ServiceWithSimulation;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const status = serviceStatusPresentation[service.status];
  const meetingSlo = isMeetingSlo(service);
  const content = (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <Link
            className={styles.serviceName}
            to={`/app/services/${service.id}`}
          >
            {service.name}
            <ArrowUpRight aria-hidden="true" size={17} />
          </Link>
          <p>{service.description}</p>
        </div>
        <StatusBadge label={status.label} status={status.tone} />
      </div>
      {service.isSimulatedStatus ? (
        <p className={styles.simulationMarker}>Simulated degradation</p>
      ) : null}
      <dl className={styles.metrics}>
        <div>
          <dt>30d uptime</dt>
          <dd>{formatServicePercentage(service.uptime30d)}</dd>
        </div>
        <div>
          <dt>SLO target</dt>
          <dd>{formatServicePercentage(service.sloTarget)}</dd>
        </div>
        <div>
          <dt>SLO result</dt>
          <dd className={meetingSlo ? styles.meeting : styles.below}>
            {meetingSlo ? 'Meeting SLO' : 'Below SLO'}
          </dd>
        </div>
        <div>
          <dt>Last deploy</dt>
          <dd>{formatServiceUtcTimestamp(service.lastDeployAt)}</dd>
        </div>
      </dl>
    </article>
  );

  if (service.status === 'degraded' || service.status === 'outage') {
    return (
      <BorderGlow
        variant={service.status === 'outage' ? 'critical' : 'warning'}
      >
        {content}
      </BorderGlow>
    );
  }
  return <div className={styles.staticCard}>{content}</div>;
}
