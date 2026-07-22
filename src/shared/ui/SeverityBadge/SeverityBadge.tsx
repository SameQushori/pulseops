import type { HTMLAttributes } from 'react';

import styles from '../Badge/Badge.module.css';

const severityLabels = {
  sev1: 'SEV-1 Critical',
  sev2: 'SEV-2 Warning',
  sev3: 'SEV-3 Advisory',
} as const;

const severityTones = {
  sev1: 'critical',
  sev2: 'warning',
  sev3: 'info',
} as const;

export interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  severity: keyof typeof severityLabels;
}

export function SeverityBadge({
  className = '',
  severity,
  ...props
}: SeverityBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[severityTones[severity]]} ${className}`}
      {...props}
    >
      {severityLabels[severity]}
    </span>
  );
}
