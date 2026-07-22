import type { HTMLAttributes, ReactNode } from 'react';

import styles from '../StateMessage/StateMessage.module.css';

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action?: ReactNode;
  headingLevel?: 1 | 2;
}

export function ErrorState({
  action,
  className = '',
  description,
  headingLevel = 2,
  title,
  ...props
}: ErrorStateProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className={`${styles.state} ${className}`} role="alert" {...props}>
      <Heading>{title}</Heading>
      <p>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
