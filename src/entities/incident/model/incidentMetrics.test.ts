import {
  incidentsFixture,
  incidentEventsFixture,
} from '../../../shared/api/mocks/fixtures';
import {
  calculateIncidentResponseMetrics,
  formatIncidentDuration,
} from './incidentMetrics';

describe('incident response metrics', () => {
  it('calculates MTTA from the earliest workflow event and MTTR from resolution', () => {
    const incident = incidentsFixture[0];
    if (!incident) throw new Error('Fixture missing');
    const result = calculateIncidentResponseMetrics(
      incident,
      incidentEventsFixture,
    );
    expect(formatIncidentDuration(result.mtta)).toBe('48m');
    expect(formatIncidentDuration(result.mttr)).toBe('48m');
  });

  it('handles missing and invalid intervals', () => {
    const incident = incidentsFixture[3];
    if (!incident) throw new Error('Fixture missing');
    expect(calculateIncidentResponseMetrics(incident, []).mtta).toBeNull();
    expect(formatIncidentDuration(null)).toBe('Not available');
    expect(formatIncidentDuration(-1)).toBe('Not available');
    expect(formatIncidentDuration(72 * 60_000)).toBe('1h 12m');
  });
});
