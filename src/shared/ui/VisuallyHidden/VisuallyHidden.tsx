import type { HTMLAttributes } from 'react';

import styles from './VisuallyHidden.module.css';

export function VisuallyHidden({
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`${styles.visuallyHidden} ${className}`} {...props} />
  );
}
