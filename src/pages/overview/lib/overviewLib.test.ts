import { metricPointsFixture } from '../../../shared/api/mocks/fixtures';
import { filterMetricPoints } from './filterMetricPoints';
import {
  formatErrorRate,
  formatIncidentCount,
  formatLatency,
  formatPercentage,
  formatThroughput,
  formatUtcTimestamp,
} from './formatOverviewValue';

describe('overview formatting', () => {
  it('formats KPI and service values consistently', () => {
    expect(formatLatency(147)).toBe('147 ms');
    expect(formatErrorRate(0.21)).toBe('0.21%');
    expect(formatThroughput(1304)).toBe('1,304 req/min');
    expect(formatIncidentCount(3)).toBe('3');
    expect(formatPercentage(99.9)).toBe('99.90%');
    expect(formatUtcTimestamp('2026-07-19T06:00:00.000Z')).toBe(
      'Jul 19, 2026, 06:00 UTC',
    );
  });
});

describe('metric point filtering', () => {
  it('uses the latest dataset timestamp instead of the current clock', () => {
    vi.setSystemTime(new Date('2035-01-01T00:00:00.000Z'));

    expect(filterMetricPoints(metricPointsFixture, '30m')).toHaveLength(2);
    expect(filterMetricPoints(metricPointsFixture, '1h')).toHaveLength(3);
    expect(filterMetricPoints(metricPointsFixture, '6h')).toHaveLength(13);
  });

  it('returns an empty collection without attempting a time calculation', () => {
    expect(filterMetricPoints([], '6h')).toEqual([]);
  });
});
