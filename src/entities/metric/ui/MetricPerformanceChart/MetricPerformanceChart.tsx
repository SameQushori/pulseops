import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MetricPoint } from '../../model/metricPoint';
import styles from './MetricPerformanceChart.module.css';

const utcTimeFormatter = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const utcTimestampFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
  timeZoneName: 'short',
});

function formatUtcTime(value: string) {
  return utcTimeFormatter.format(new Date(value));
}

function formatUtcTimestamp(value: string) {
  return utcTimestampFormatter.format(new Date(value));
}

function formatLatency(value: number) {
  return `${Math.round(value)} ms`;
}

function formatErrorRate(value: number) {
  return `${value.toFixed(2)}%`;
}

interface MetricPerformanceChartProps {
  points: readonly MetricPoint[];
  accessibleLabel: string;
  description: string;
  fallbackCaption?: string;
}

export function MetricPerformanceChart({
  accessibleLabel,
  description,
  fallbackCaption = 'Latency and error rate values',
  points,
}: MetricPerformanceChartProps) {
  return (
    <figure className={styles.figure}>
      <p className={styles.description}>{description}</p>
      <div className={styles.legend} aria-label="Chart units">
        <span>
          <i className={styles.latencyKey} />
          Latency · ms
        </span>
        <span>
          <i className={styles.errorKey} />
          Error rate · %
        </span>
      </div>
      <div className={styles.canvas} role="img" aria-label={accessibleLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={[...points]}
            margin={{ top: 12, right: 8, bottom: 4, left: -12 }}
          >
            <CartesianGrid
              stroke="var(--color-border)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="timestamp"
              minTickGap={28}
              tick={{ fill: 'var(--color-text-subtle)', fontSize: 12 }}
              tickFormatter={formatUtcTime}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              domain={['auto', 'auto']}
              tick={{ fill: 'var(--color-text-subtle)', fontSize: 12 }}
              tickLine={false}
              width={52}
              yAxisId="latency"
            />
            <YAxis
              axisLine={false}
              domain={[0, 'auto']}
              orientation="right"
              tick={{ fill: 'var(--color-text-subtle)', fontSize: 12 }}
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              width={42}
              yAxisId="errors"
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface-sunken)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
              }}
              formatter={(value, name) => [
                name === 'latencyMs'
                  ? formatLatency(Number(value))
                  : formatErrorRate(Number(value)),
                name === 'latencyMs' ? 'Latency' : 'Error rate',
              ]}
              labelFormatter={(label) => formatUtcTimestamp(String(label))}
            />
            <Line
              activeDot={{ r: 4 }}
              dataKey="latencyMs"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              type="monotone"
              yAxisId="latency"
            />
            <Line
              activeDot={{ r: 3 }}
              dataKey="errorRate"
              dot={false}
              isAnimationActive={false}
              stroke="var(--color-warning)"
              strokeWidth={1.75}
              type="monotone"
              yAxisId="errors"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.srOnly}>
        <table>
          <caption>{fallbackCaption}</caption>
          <thead>
            <tr>
              <th scope="col">Timestamp</th>
              <th scope="col">Latency</th>
              <th scope="col">Error rate</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.timestamp}>
                <td>{formatUtcTimestamp(point.timestamp)}</td>
                <td>{formatLatency(point.latencyMs)}</td>
                <td>{formatErrorRate(point.errorRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
