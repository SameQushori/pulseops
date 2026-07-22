import type { MetricPoint } from '../../../entities/metric/model/metricPoint';
import type { TimeRange } from '../../../features/time-range/model/preferencesSlice';

const rangeDurationMs: Record<TimeRange, number> = {
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
};

export function filterMetricPoints(
  points: MetricPoint[],
  timeRange: TimeRange,
) {
  if (points.length === 0) return [];

  const latestTimestamp = Math.max(
    ...points.map(({ timestamp }) => new Date(timestamp).getTime()),
  );
  const earliestTimestamp = latestTimestamp - rangeDurationMs[timeRange];

  return points.filter(
    ({ timestamp }) => new Date(timestamp).getTime() >= earliestTimestamp,
  );
}
