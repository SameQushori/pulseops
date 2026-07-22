import { servicesFixture } from '../../../shared/api/mocks/fixtures';
import { getServiceStatusBreakdown, isMeetingSlo } from './servicePresentation';

describe('service presentation utilities', () => {
  it('compares uptime directly with the SLO target', () => {
    expect(isMeetingSlo({ uptime30d: 99.95, sloTarget: 99.95 })).toBe(true);
    expect(isMeetingSlo({ uptime30d: 99.94, sloTarget: 99.95 })).toBe(false);
  });

  it('counts every service status', () => {
    const service = servicesFixture[0];
    if (!service) throw new Error('A service fixture is required.');
    expect(
      getServiceStatusBreakdown([
        ...servicesFixture,
        { ...service, id: 'degraded', status: 'degraded' },
        { ...service, id: 'outage', status: 'outage' },
      ]),
    ).toEqual({ operational: 4, degraded: 1, outage: 1 });
  });
});
