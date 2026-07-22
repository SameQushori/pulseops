import styles from '../OverviewPage.module.css';

export function OverviewSkeleton() {
  return (
    <section
      className={styles.page}
      aria-labelledby="overview-loading-title"
      aria-busy="true"
    >
      <div className={styles.srOnly} role="status">
        Loading overview data
      </div>
      <div className={styles.skeletonHeader}>
        <div>
          <div className={`${styles.skeleton} ${styles.skeletonEyebrow}`} />
          <div
            className={`${styles.skeleton} ${styles.skeletonTitle}`}
            id="overview-loading-title"
          />
          <div className={`${styles.skeleton} ${styles.skeletonDescription}`} />
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonControl}`} />
      </div>
      <div className={styles.metricGrid}>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className={`${styles.skeleton} ${styles.skeletonMetric}`}
            key={index}
          />
        ))}
      </div>
      <div className={styles.primaryGrid}>
        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
        <div className={`${styles.skeleton} ${styles.skeletonActivity}`} />
      </div>
      <div className={`${styles.skeleton} ${styles.skeletonServices}`} />
    </section>
  );
}
