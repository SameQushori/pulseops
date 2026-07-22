import type { HTMLAttributes } from 'react';

import styles from '../Badge/Badge.module.css';

type StatusTone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  status: StatusTone | 'unavailable';
}

export function StatusBadge({
  className = '',
  label,
  status,
  ...props
}: StatusBadgeProps) {
  const tone = status === 'unavailable' ? 'neutral' : status;
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className}`} {...props}>
      {label}
    </span>
  );
}
