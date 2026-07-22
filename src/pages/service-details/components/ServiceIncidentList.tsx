import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Incident } from '../../../entities/incident/model/incident';
import {
  formatIncidentStartedAt,
  getIncidentStatusPresentation,
} from '../../../entities/incident/model/incidentPresentation';
import { SIMULATED_INCIDENT_ID } from '../../../features/incident-simulation/model/simulationScenario';
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState';
import { SeverityBadge } from '../../../shared/ui/SeverityBadge/SeverityBadge';
import { StatusBadge } from '../../../shared/ui/StatusBadge/StatusBadge';
import styles from '../ServiceDetailsPage.module.css';

export function ServiceIncidentList({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        title="No recent incidents"
        description="No incident history is associated with this service."
      />
    );
  }
  return (
    <ul className={styles.incidentList} aria-label="Recent service incidents">
      {incidents.map((incident) => {
        const status = getIncidentStatusPresentation(incident.status);
        return (
          <li key={incident.id}>
            <div className={styles.incidentTitle}>
              <Link to={`/app/incidents/${incident.id}`}>
                {incident.title}
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
              {incident.id === SIMULATED_INCIDENT_ID ? (
                <span className={styles.demoMarker}>Demo incident</span>
              ) : null}
            </div>
            <div className={styles.incidentBadges}>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge label={status.label} status={status.tone} />
            </div>
            <dl className={styles.incidentMeta}>
              <div>
                <dt>Started</dt>
                <dd>{formatIncidentStartedAt(incident.startedAt)}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{incident.owner ?? 'Unassigned'}</dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
