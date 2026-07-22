import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  BorderGlow,
  type BorderGlowVariant,
} from '../../../shared/ui/react-bits/BorderGlow/BorderGlow';
import styles from '../OverviewPage.module.css';

interface MetricCardProps {
  context: string;
  href?: string;
  icon: LucideIcon;
  label: string;
  tone?: BorderGlowVariant;
  value: string;
}

export function MetricCard({
  context,
  href,
  icon: Icon,
  label,
  tone = 'stable',
  value,
}: MetricCardProps) {
  const content = (
    <article className={styles.metricCard}>
      <div className={styles.metricCardHeader}>
        <span className={styles.metricIcon} aria-hidden="true">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        <span className={styles.metricLabel}>{label}</span>
        {href ? <ArrowUpRight aria-hidden="true" size={17} /> : null}
      </div>
      <strong className={styles.metricValue}>{value}</strong>
      <p>{context}</p>
    </article>
  );

  return (
    <BorderGlow className={styles.metricGlow} variant={tone}>
      {href ? (
        <Link
          className={styles.metricLink}
          to={href}
          aria-label={`${label}: ${value}`}
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </BorderGlow>
  );
}
