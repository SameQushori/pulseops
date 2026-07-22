import type { Service } from '../../../entities/service/model/service';
import {
  formatServicePercentage,
  formatServiceUtcTimestamp,
  isMeetingSlo,
  serviceStatusPresentation,
} from '../../../entities/service/model/servicePresentation';
import { StatusBadge } from '../../../shared/ui/StatusBadge/StatusBadge';
import styles from '../ServiceDetailsPage.module.css';

export function ServiceReliability({ service }: { service: Service }) {
  const status = serviceStatusPresentation[service.status];
  const meetingSlo = isMeetingSlo(service);
  return (
    <section className={styles.panel} aria-labelledby="reliability-title">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>Reliability summary</p>
          <h2 id="reliability-title">Health and objective</h2>
        </div>
      </div>
      <dl className={styles.reliabilityGrid}>
        <div>
          <dt>SLO target</dt>
          <dd>{formatServicePercentage(service.sloTarget)}</dd>
        </div>
        <div>
          <dt>30d uptime</dt>
          <dd>{formatServicePercentage(service.uptime30d)}</dd>
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
        <div>
          <dt>Current status</dt>
          <dd>
            <StatusBadge label={status.label} status={status.tone} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
