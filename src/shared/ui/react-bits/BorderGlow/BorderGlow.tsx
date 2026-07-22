import {
  useCallback,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';

import styles from './BorderGlow.module.css';

// Adapted from the official React Bits TS + CSS source:
// https://reactbits.dev/components/border-glow
export type BorderGlowVariant = 'stable' | 'warning' | 'critical';

interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  variant?: BorderGlowVariant;
}

type GlowStyle = CSSProperties & {
  '--cursor-angle': string;
  '--edge-proximity': string;
};

export function BorderGlow({
  children,
  className = '',
  variant = 'stable',
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const variantClass = styles[variant] ?? '';

  const updateGlow = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    const horizontalScale =
      deltaX === 0 ? Infinity : centerX / Math.abs(deltaX);
    const verticalScale = deltaY === 0 ? Infinity : centerY / Math.abs(deltaY);
    const edgeProximity = Math.min(
      Math.max(1 / Math.min(horizontalScale, verticalScale), 0),
      1,
    );
    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90;

    card.style.setProperty(
      '--edge-proximity',
      (edgeProximity * 100).toFixed(3),
    );
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }, []);

  const resetGlow = useCallback(() => {
    cardRef.current?.style.setProperty('--edge-proximity', '0');
  }, []);

  const initialStyle: GlowStyle = {
    '--cursor-angle': '45deg',
    '--edge-proximity': '0',
  };

  return (
    <div
      className={`${styles.card} ${variantClass} ${className}`}
      data-border-glow-variant={variant}
      onPointerMove={updateGlow}
      onPointerLeave={resetGlow}
      ref={cardRef}
      style={initialStyle}
    >
      <span className={styles.mesh} aria-hidden="true" />
      <span className={styles.edgeLight} aria-hidden="true" />
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
