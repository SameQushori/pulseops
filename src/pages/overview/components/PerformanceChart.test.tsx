import { render, screen } from '@testing-library/react';

import { metricPointsFixture } from '../../../shared/api/mocks/fixtures';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Line: ({
    dataKey,
    isAnimationActive,
  }: {
    dataKey: string;
    isAnimationActive: boolean;
  }) => (
    <span
      data-testid={`line-${dataKey}`}
      data-animation-active={String(isAnimationActive)}
    />
  ),
}));

import { PerformanceChart } from './PerformanceChart';

describe('PerformanceChart', () => {
  it('disables initial animation for both visible series', () => {
    render(
      <PerformanceChart
        points={metricPointsFixture.slice(-2)}
        timeRange="30m"
      />,
    );

    expect(screen.getByTestId('line-latencyMs')).toHaveAttribute(
      'data-animation-active',
      'false',
    );
    expect(screen.getByTestId('line-errorRate')).toHaveAttribute(
      'data-animation-active',
      'false',
    );
  });
});
