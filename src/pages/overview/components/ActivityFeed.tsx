import {
  CircleAlert,
  MessageSquareText,
  RefreshCw,
  Siren,
  UserRoundCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type { IncidentEvent } from '../../../entities/event/model/incidentEvent';
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState';
import { formatUtcTimestamp } from '../lib/formatOverviewValue';
import styles from '../OverviewPage.module.css';

const eventPresentation = {
  created: { icon: Siren, label: 'Incident created' },
  status_changed: { icon: RefreshCw, label: 'Status changed' },
  owner_changed: { icon: UserRoundCheck, label: 'Owner changed' },
  note_added: { icon: MessageSquareText, label: 'Note added' },
  metric_alert: { icon: CircleAlert, label: 'Metric alert' },
} as const;

interface ActivityFeedProps {
  events: IncidentEvent[];
  nonNavigableIncidentId?: string;
}

export function ActivityFeed({
  events,
  nonNavigableIncidentId,
}: ActivityFeedProps) {
  const sortedEvents = [...events].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  return (
    <section
      className={`${styles.panel} ${styles.activityPanel}`}
      aria-labelledby="activity-title"
    >
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>Recent activity</p>
          <h2 id="activity-title">Latest events</h2>
        </div>
      </div>

      {sortedEvents.length === 0 ? (
        <EmptyState
          className={styles.localState}
          title="No recent activity"
          description="Incident and metric events will appear here when activity is recorded."
        />
      ) : (
        <ol className={styles.activityList}>
          {sortedEvents.map((event) => {
            const presentation = eventPresentation[event.type];
            const EventIcon = presentation.icon;
            return (
              <li key={event.id}>
                <span className={styles.eventIcon} aria-hidden="true">
                  <EventIcon size={17} strokeWidth={1.8} />
                </span>
                <div className={styles.eventCopy}>
                  <span className={styles.eventType}>{presentation.label}</span>
                  <p>{event.message}</p>
                  <time dateTime={event.createdAt}>
                    {formatUtcTimestamp(event.createdAt)}
                  </time>
                </div>
                {event.incidentId === nonNavigableIncidentId ? (
                  <span className={styles.eventLabel}>Simulated</span>
                ) : (
                  <Link
                    className={styles.eventLink}
                    to={`/app/incidents/${event.incidentId}`}
                    aria-label={`Open incident for event: ${event.message}`}
                  >
                    Open
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
