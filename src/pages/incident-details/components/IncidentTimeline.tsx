import { Activity, Bell, CircleCheck, FileText, UserRound } from 'lucide-react';

import type { IncidentEvent } from '../../../entities/event/model/incidentEvent';
import styles from '../IncidentDetailsPage.module.css';

const labels = {
  created: 'Incident created',
  status_changed: 'Status changed',
  owner_changed: 'Owner changed',
  note_added: 'Note added',
  metric_alert: 'Metric alert',
} as const;

const icons = {
  created: Bell,
  status_changed: CircleCheck,
  owner_changed: UserRound,
  note_added: FileText,
  metric_alert: Activity,
} as const;

const formatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export function IncidentTimeline({
  events,
}: {
  events: readonly IncidentEvent[];
}) {
  if (events.length === 0) {
    return (
      <p className={styles.neutralState}>
        No timeline events are available yet.
      </p>
    );
  }
  return (
    <ol className={styles.timeline} aria-label="Incident timeline">
      {events.map((event) => {
        const Icon = icons[event.type];
        return (
          <li key={event.id}>
            <span className={styles.timelineIcon}>
              <Icon aria-hidden="true" size={16} />
            </span>
            <div>
              <strong>{labels[event.type]}</strong>
              <p>{event.message}</p>
              <time dateTime={event.createdAt}>
                {formatter.format(new Date(event.createdAt))} UTC
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
