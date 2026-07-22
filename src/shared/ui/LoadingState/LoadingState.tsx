import type { HTMLAttributes } from 'react';

import styles from './LoadingState.module.css';

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function LoadingState({
  className = '',
  label = 'Loading',
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={`${styles.loading} ${className}`}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span className={styles.indicator} aria-hidden="true" />
      {label}
    </div>
  );
}
