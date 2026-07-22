import styles from '../ServiceDetailsPage.module.css';

export function ServiceDetailsSkeleton() {
  return (
    <section
      className={styles.skeleton}
      role="status"
      aria-label="Loading service details"
    >
      <span className={styles.srOnly}>Loading service details</span>
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonSummary} />
      <div className={styles.skeletonChart} />
    </section>
  );
}
