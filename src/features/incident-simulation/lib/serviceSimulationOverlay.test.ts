import {
  incidentsFixture,
  servicesFixture,
} from '../../../shared/api/mocks/fixtures';
import { buildSimulationScenario } from '../model/simulationScenario';
import { initialSimulationState } from '../model/simulationSlice';
import {
  applyServiceStatusOverlay,
  mergeSimulatedServiceIncident,
} from './serviceSimulationOverlay';

describe('service simulation overlay', () => {
  const payments = servicesFixture[0];
  if (!payments) throw new Error('Payments fixture is required.');
  const scenario = buildSimulationScenario({
    timestamp: '2026-07-19T06:00:00.000Z',
    latencyMs: 147,
    errorRate: 0.21,
    throughput: 1304,
  });

  it('returns equivalent immutable API values without an override', () => {
    const result = applyServiceStatusOverlay(
      servicesFixture,
      initialSimulationState,
    );
    expect(result).toMatchObject(servicesFixture);
    expect(result).not.toBe(servicesFixture);
    expect(result[0]).not.toBe(payments);
  });

  it('overrides only Payments and represents recovery', () => {
    const degraded = applyServiceStatusOverlay(servicesFixture, {
      serviceStatusOverride: 'degraded',
    });
    expect(degraded[0]).toMatchObject({
      id: payments.id,
      status: 'degraded',
      isSimulatedStatus: true,
    });
    expect(
      degraded.slice(1).every(({ status }) => status === 'operational'),
    ).toBe(true);
    const recovered = applyServiceStatusOverlay(servicesFixture, {
      serviceStatusOverride: 'operational',
    });
    expect(recovered[0]).toMatchObject({
      status: 'operational',
      isSimulatedStatus: false,
      hasSimulationOverride: true,
    });
    expect(servicesFixture[0]?.status).toBe('operational');
  });

  it('merges the demo incident only into Payments, deduplicated and newest first', () => {
    const paymentsIncidents = incidentsFixture.filter(
      ({ serviceId }) => serviceId === payments.id,
    );
    const merged = mergeSimulatedServiceIncident(
      [...paymentsIncidents, scenario.incident],
      payments.id,
      scenario.incident,
    );
    expect(merged.filter(({ id }) => id === scenario.incident.id)).toHaveLength(
      1,
    );
    expect(merged[0]?.id).toBe(scenario.incident.id);
    expect(
      mergeSimulatedServiceIncident([], 'service-identity', scenario.incident),
    ).toEqual([]);
  });
});
