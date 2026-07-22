import {
  incidentEventsFixture,
  incidentNotesFixture,
  incidentsFixture,
  metricPointsFixture,
  servicesFixture,
} from '../../../shared/api/mocks/fixtures';
import { adaptApiIncidentDetails } from './incidentDetailsViewModel';

describe('incident details adapter', () => {
  it('sorts copied inputs without mutating source arrays', () => {
    const incident = incidentsFixture[0];
    const service = servicesFixture[0];
    if (!incident || !service) throw new Error('Fixture missing');
    const timeline = [...incidentEventsFixture].reverse();
    const original = [...timeline];
    const view = adaptApiIncidentDetails(
      { incident, service, timeline, notes: incidentNotesFixture },
      metricPointsFixture,
    );
    expect(view.timeline.map(({ createdAt }) => createdAt).sort()).toEqual(
      view.timeline.map(({ createdAt }) => createdAt),
    );
    expect(timeline).toEqual(original);
    expect(view.metrics).not.toBe(metricPointsFixture);
  });
});
