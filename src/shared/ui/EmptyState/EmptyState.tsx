import type { HTMLAttributes, ReactNode } from 'react';

import styles from '../StateMessage/StateMessage.module.css';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  action,
  className = '',
  description,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div className={`${styles.state} ${className}`} {...props}>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
