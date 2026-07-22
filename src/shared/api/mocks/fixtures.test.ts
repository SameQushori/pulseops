import { incidentSchema } from '../../../entities/incident/model/incident';
import { serviceSchema } from '../../../entities/service/model/service';
import { serviceDetailsResponseSchema } from '../../../entities/service/model/serviceDetails';
import { overviewResponseSchema } from '../../../features/overview-data/model/overview';
import {
  incidentEventsFixture,
  incidentNotesFixture,
  incidentsFixture,
  metricPointsFixture,
  overviewFixture,
  getServiceDependencies,
  serviceDependencyIds,
  servicesFixture,
} from './fixtures';

describe('domain schemas and fixtures', () => {
  it('validates every deterministic fixture collection', () => {
    expect(servicesFixture).toHaveLength(4);
    expect(incidentsFixture).toHaveLength(6);
    expect(incidentEventsFixture.length).toBeGreaterThan(0);
    expect(incidentNotesFixture.length).toBeGreaterThan(0);
    expect(metricPointsFixture).toHaveLength(13);
    expect(metricPointsFixture.at(0)?.timestamp).toBe(
      '2026-07-19T00:00:00.000Z',
    );
    expect(metricPointsFixture.at(-1)?.timestamp).toBe(
      '2026-07-19T06:00:00.000Z',
    );
    expect(overviewResponseSchema.parse(overviewFixture)).toEqual(
      overviewFixture,
    );
  });

  it('keeps fixture relations valid', () => {
    const serviceIds = new Set(servicesFixture.map(({ id }) => id));
    const incidentIds = new Set(incidentsFixture.map(({ id }) => id));

    expect(
      incidentsFixture.every(({ serviceId }) => serviceIds.has(serviceId)),
    ).toBe(true);
    expect(
      incidentEventsFixture.every(({ incidentId }) =>
        incidentIds.has(incidentId),
      ),
    ).toBe(true);
    expect(
      incidentNotesFixture.every(({ incidentId }) =>
        incidentIds.has(incidentId),
      ),
    ).toBe(true);
  });

  it('keeps the direct dependency map deterministic and valid', () => {
    expect(serviceDependencyIds).toEqual({
      'service-checkout': ['service-payments', 'service-identity'],
      'service-payments': ['service-identity'],
      'service-notifications': ['service-identity'],
      'service-identity': [],
    });
    for (const service of servicesFixture) {
      const dependencies = getServiceDependencies(service.id);
      expect(dependencies.every(({ id }) => id !== service.id)).toBe(true);
      expect(new Set(dependencies.map(({ id }) => id)).size).toBe(
        dependencies.length,
      );
      expect(() =>
        serviceDetailsResponseSchema.parse({
          service,
          dependencies,
          incidents: incidentsFixture.filter(
            ({ serviceId }) => serviceId === service.id,
          ),
          metrics: metricPointsFixture,
        }),
      ).not.toThrow();
    }
  });

  it('requires unique non-self dependencies in service details', () => {
    const service = servicesFixture[0];
    if (!service) throw new Error('A service fixture is required.');
    expect(() =>
      serviceDetailsResponseSchema.parse({
        service,
        incidents: [],
        metrics: [],
      }),
    ).toThrow();
    expect(() =>
      serviceDetailsResponseSchema.parse({
        service,
        dependencies: [service],
        incidents: [],
        metrics: [],
      }),
    ).toThrow();
    const dependency = servicesFixture[2];
    if (!dependency) throw new Error('A dependency fixture is required.');
    expect(() =>
      serviceDetailsResponseSchema.parse({
        service,
        dependencies: [dependency, dependency],
        incidents: [],
        metrics: [],
      }),
    ).toThrow();
  });

  it('rejects malformed timestamps', () => {
    expect(() =>
      serviceSchema.parse({ ...servicesFixture[0], lastDeployAt: 'yesterday' }),
    ).toThrow();
  });

  it('rejects unknown enum values', () => {
    expect(() =>
      incidentSchema.parse({ ...incidentsFixture[0], severity: 'sev4' }),
    ).toThrow();
  });

  it('rejects malformed nested response data', () => {
    expect(() =>
      overviewResponseSchema.parse({
        ...overviewFixture,
        services: [{ ...servicesFixture[0], uptime30d: 120 }],
      }),
    ).toThrow();
  });
});
