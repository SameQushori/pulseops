import type { Incident } from '../../../entities/incident/model/incident';
import { VisuallyHidden } from '../../../shared/ui/VisuallyHidden/VisuallyHidden';
import { IncidentRow } from './IncidentRow';
import styles from '../IncidentsPage.module.css';

interface IncidentsTableProps {
  incidents: readonly Incident[];
  serviceNames: ReadonlyMap<string, string>;
  simulatedIncidentId?: string;
}

export function IncidentsTable({
  incidents,
  serviceNames,
  simulatedIncidentId,
}: IncidentsTableProps) {
  return (
    <div className={styles.tableFrame}>
      <table className={styles.table}>
        <caption>
          <VisuallyHidden>
            Incidents matching the applied filters
          </VisuallyHidden>
        </caption>
        <thead>
          <tr>
            <th scope="col">Incident</th>
            <th scope="col">Service</th>
            <th scope="col">Severity</th>
            <th scope="col">Status</th>
            <th scope="col">Started</th>
            <th scope="col">Owner</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <IncidentRow
              incident={incident}
              isSimulated={incident.id === simulatedIncidentId}
              key={incident.id}
              serviceName={
                serviceNames.get(incident.serviceId) ?? incident.serviceId
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
