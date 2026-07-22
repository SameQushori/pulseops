import styles from '../LandingPage.module.css';

export function SystemPreview() {
  return (
    <figure className={styles.preview} aria-labelledby="preview-caption">
      <div className={styles.previewHeader}>
        <div>
          <p>Simulated scenario preview</p>
          <strong>System overview</strong>
        </div>
        <span className={styles.previewDataLabel}>Preview data</span>
      </div>

      <div className={styles.overallStatus}>
        <span className={styles.statusSignal} aria-hidden="true" />
        <div>
          <span>Overall status</span>
          <strong>Degraded · Payments API affected</strong>
        </div>
      </div>

      <dl className={styles.previewMetrics}>
        <div>
          <dt>Latency</dt>
          <dd>
            <strong>842 ms</strong>
            <span>Above 220 ms baseline</span>
          </dd>
        </div>
        <div>
          <dt>Error rate</dt>
          <dd>
            <strong>8.4%</strong>
            <span>Threshold exceeded</span>
          </dd>
        </div>
        <div>
          <dt>Active incident</dt>
          <dd>
            <strong>SEV-2</strong>
            <span>Investigating</span>
          </dd>
        </div>
      </dl>

      <div className={styles.trend}>
        <div className={styles.trendLabel}>
          <span>Latency trend</span>
          <span>Last 15 minutes</span>
        </div>
        <svg
          viewBox="0 0 560 120"
          role="img"
          aria-label="Illustrative latency trend rising above its baseline"
        >
          <path className={styles.baseline} d="M0 87 H560" />
          <path
            className={styles.trendArea}
            d="M0 90 L70 86 L140 88 L210 80 L280 82 L350 65 L420 45 L490 26 L560 18 L560 120 L0 120 Z"
          />
          <path
            className={styles.trendLine}
            d="M0 90 L70 86 L140 88 L210 80 L280 82 L350 65 L420 45 L490 26 L560 18"
          />
        </svg>
      </div>

      <div className={styles.activityEvent}>
        <span className={styles.eventTime}>02:14</span>
        <p>
          <strong>Metric alert created</strong>
          Payments API error rate crossed the incident threshold.
        </p>
      </div>

      <figcaption id="preview-caption">
        A static illustration of the simulated degradation scenario available in
        the PulseOps demo.
      </figcaption>
    </figure>
  );
}
