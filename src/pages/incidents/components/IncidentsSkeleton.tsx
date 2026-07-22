import { VisuallyHidden } from '../../../shared/ui/VisuallyHidden/VisuallyHidden';
import styles from '../IncidentsPage.module.css';

export function IncidentsSkeleton() {
  return (
    <div className={styles.tableFrame} role="status" aria-live="polite">
      <VisuallyHidden>Loading incidents</VisuallyHidden>
      <table
        className={`${styles.table} ${styles.skeletonTable}`}
        aria-hidden="true"
      >
        <thead>
          <tr>
            <th>Incident</th>
            <th>Service</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Started</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3].map((row) => (
            <tr key={row}>
              {[0, 1, 2, 3, 4, 5].map((cell) => (
                <td key={cell} data-label="Loading">
                  <span className={styles.skeletonLine} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
