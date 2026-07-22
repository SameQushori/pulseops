import { CheckCircle2, CircleAlert, TriangleAlert } from 'lucide-react';

import type { OverallStatus } from '../../../features/overview-data/model/overview';
import { StatusBadge } from '../../../shared/ui/StatusBadge/StatusBadge';
import { TimeRangeControl } from './TimeRangeControl';
import styles from '../OverviewPage.module.css';

const statusDetails = {
  operational: {
    badgeStatus: 'success',
    description:
      'All monitored services are operating within their objectives.',
    icon: CheckCircle2,
    label: 'Operational',
  },
  degraded: {
    badgeStatus: 'warning',
    description: 'One or more monitored services are currently degraded.',
    icon: TriangleAlert,
    label: 'Degraded',
  },
  outage: {
    badgeStatus: 'critical',
    description: 'A monitored service outage requires attention.',
    icon: CircleAlert,
    label: 'Outage',
  },
} as const;

interface OverviewHeaderProps {
  status: OverallStatus;
}

export function OverviewHeader({ status }: OverviewHeaderProps) {
  const details = statusDetails[status];
  const StatusIcon = details.icon;

  return (
    <header className={styles.header}>
      <div className={styles.headerCopy}>
        <p className={styles.eyebrow}>System workspace</p>
        <h1 className={styles.title} id="overview-title">
          Overview
        </h1>
        <p className={styles.description}>{details.description}</p>
        <div className={styles.statusRow}>
          <StatusBadge label={details.label} status={details.badgeStatus} />
          <span className={styles.statusText}>
            <StatusIcon aria-hidden="true" size={16} />
            Overall system status
          </span>
          <span className={styles.environmentLabel}>Simulated environment</span>
        </div>
      </div>
      <TimeRangeControl />
    </header>
  );
}
