import styles from '../ServicesPage.module.css';

export function ServicesSkeleton() {
  return (
    <div
      className={styles.skeleton}
      role="status"
      aria-label="Loading services"
    >
      <span className={styles.srOnly}>Loading services</span>
      <div className={styles.skeletonHeader} />
      <div className={styles.grid}>
        {Array.from({ length: 4 }, (_, index) => (
          <div className={styles.skeletonCard} key={index} />
        ))}
      </div>
    </div>
  );
}
