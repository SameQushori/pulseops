import type { ButtonHTMLAttributes } from 'react';

import styles from './IconButton.module.css';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  'aria-label': string;
};

export function IconButton({
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={`${styles.iconButton} ${className}`}
      type={type}
      {...props}
    />
  );
}
