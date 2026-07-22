import { Link } from 'react-router-dom';

import type { Incident } from '../../../entities/incident/model/incident';
import { SeverityBadge } from '../../../shared/ui/SeverityBadge/SeverityBadge';
import { StatusBadge } from '../../../shared/ui/StatusBadge/StatusBadge';
import {
  formatIncidentStartedAt,
  getIncidentStatusPresentation,
} from '../lib/formatIncident';
import styles from '../IncidentsPage.module.css';

interface IncidentRowProps {
  incident: Incident;
  isSimulated: boolean;
  serviceName: string;
}

export function IncidentRow({
  incident,
  isSimulated,
  serviceName,
}: IncidentRowProps) {
  const status = getIncidentStatusPresentation(incident.status);

  return (
    <tr>
      <td className={styles.incidentCell} data-label="Incident">
        <Link to={`/app/incidents/${incident.id}`}>{incident.title}</Link>
        {isSimulated ? (
          <span className={styles.demoMarker}>Demo incident</span>
        ) : null}
        <span className={styles.summary}>{incident.summary}</span>
      </td>
      <td data-label="Service">{serviceName}</td>
      <td data-label="Severity">
        <SeverityBadge severity={incident.severity} />
      </td>
      <td data-label="Status">
        <StatusBadge
          className={styles.statusBadge}
          label={status.label}
          status={status.tone}
        />
      </td>
      <td data-label="Started">
        <time dateTime={incident.startedAt}>
          {formatIncidentStartedAt(incident.startedAt)}
        </time>
      </td>
      <td data-label="Owner">{incident.owner ?? 'Unassigned'}</td>
    </tr>
  );
}
