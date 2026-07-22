import type { MetricPoint } from '../../../entities/metric/model/metricPoint';
import { MetricPerformanceChart } from '../../../entities/metric/ui/MetricPerformanceChart/MetricPerformanceChart';
import type { TimeRange } from '../../../features/time-range/model/preferencesSlice';
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState';
import styles from '../OverviewPage.module.css';

const rangeLabels: Record<TimeRange, string> = {
  '30m': '30 minutes',
  '1h': '1 hour',
  '6h': '6 hours',
};

interface PerformanceChartProps {
  points: MetricPoint[];
  timeRange: TimeRange;
}

export function PerformanceChart({ points, timeRange }: PerformanceChartProps) {
  return (
    <section
      className={`${styles.panel} ${styles.chartPanel}`}
      aria-labelledby="performance-title"
    >
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>Performance</p>
          <h2 id="performance-title">Latency and error rate</h2>
        </div>
        <div className={styles.chartLegend} aria-label="Chart units">
          <span>
            <i className={styles.latencyKey} />
            Latency · ms
          </span>
          <span>
            <i className={styles.errorKey} />
            Error rate · %
          </span>
        </div>
      </div>

      {points.length === 0 ? (
        <EmptyState
          className={styles.localState}
          title="No performance data"
          description={`No metric points are available for the selected ${rangeLabels[timeRange]} range.`}
        />
      ) : (
        <MetricPerformanceChart
          points={points}
          accessibleLabel={`Latency and error rate for the latest ${rangeLabels[timeRange]}`}
          description={`Performance over the latest ${rangeLabels[timeRange]}, ending at the most recent timestamp in the dataset. Latency uses the left axis in milliseconds and error rate uses the right axis in percent.`}
        />
      )}
    </section>
  );
}
