import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type Ref,
} from 'react';

import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: false;
  variant?: ButtonVariant;
  ref?: Ref<HTMLButtonElement>;
};

interface ChildButtonProps {
  asChild: true;
  children: ReactElement<{ className?: string }>;
  className?: string;
  variant?: ButtonVariant;
}

export type ButtonProps = NativeButtonProps | ChildButtonProps;

export function Button(props: ButtonProps) {
  const { className = '', variant = 'primary' } = props;
  const classes = `${styles.button} ${styles[variant]} ${className}`;

  if (props.asChild) {
    const { children } = props;
    if (!isValidElement(children)) return null;
    return cloneElement(children, {
      className: `${classes} ${children.props.className ?? ''}`,
    });
  }

  const buttonProps = { ...props };
  delete buttonProps.asChild;
  delete buttonProps.variant;

  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? 'button'}
      className={classes}
    />
  );
}
