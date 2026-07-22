import type { Incident } from '../../../entities/incident/model/incident';
import { incidentsFixture } from '../../../shared/api/mocks/fixtures';
import { defaultIncidentFilters } from '../../../features/incident-filters/model/incidentFilters';
import { buildSimulationScenario } from '../../../features/incident-simulation/model/simulationScenario';
import { metricPointsFixture } from '../../../shared/api/mocks/fixtures';
import { mergeIncidentList } from './mergeIncidentList';

const baselinePoint = metricPointsFixture.at(-1);
if (!baselinePoint) throw new Error('A baseline metric point is required.');
const simulatedIncident = buildSimulationScenario(baselinePoint).incident;

describe('mergeIncidentList', () => {
  it('returns a sorted copy of API items when simulation is absent', () => {
    const result = mergeIncidentList({
      apiItems: incidentsFixture,
      simulatedIncident: null,
      filters: defaultIncidentFilters,
    });
    expect(result).toHaveLength(6);
    expect(result[0]?.id).toBe('incident-notification-delay');
    expect(result).not.toBe(incidentsFixture);
  });

  it('adds and sorts the simulated incident', () => {
    const result = mergeIncidentList({
      apiItems: incidentsFixture,
      simulatedIncident,
      filters: defaultIncidentFilters,
    });
    expect(result).toHaveLength(7);
    expect(result).toContain(simulatedIncident);
    expect(result.map(({ id }) => id)).toEqual([
      'incident-notification-delay',
      simulatedIncident.id,
      'incident-checkout-errors',
      'incident-identity-tokens',
      'incident-payments-latency',
      'incident-checkout-assets',
      'incident-identity-login',
    ]);
  });

  it('deduplicates by ID with the simulated state taking precedence', () => {
    const duplicate = { ...simulatedIncident, status: 'resolved' } as Incident;
    const result = mergeIncidentList({
      apiItems: [duplicate],
      simulatedIncident,
      filters: defaultIncidentFilters,
    });
    expect(result).toEqual([simulatedIncident]);
  });

  it.each([
    [{ query: 'payment authorization' }, true],
    [{ query: 'not present' }, false],
    [{ status: 'investigating' }, true],
    [{ status: 'resolved' }, false],
    [{ severity: 'sev2' }, true],
    [{ severity: 'sev1' }, false],
    [{ serviceId: 'service-payments' }, true],
    [{ serviceId: 'service-identity' }, false],
  ] as const)('applies simulated filter %o', (patch, expected) => {
    const result = mergeIncidentList({
      apiItems: [],
      simulatedIncident,
      filters: { ...defaultIncidentFilters, ...patch },
    });
    expect(result).toHaveLength(expected ? 1 : 0);
  });

  it('supports newest, oldest and severity sorting with an ID tie-breaker', () => {
    const tied = [
      { ...incidentsFixture[0], id: 'incident-z', severity: 'sev1' },
      { ...incidentsFixture[0], id: 'incident-a', severity: 'sev1' },
      { ...incidentsFixture[1], id: 'incident-m', severity: 'sev3' },
    ] satisfies Incident[];

    expect(
      mergeIncidentList({
        apiItems: tied,
        simulatedIncident: null,
        filters: { ...defaultIncidentFilters, sort: 'newest' },
      }).map(({ id }) => id),
    ).toEqual(['incident-m', 'incident-a', 'incident-z']);
    expect(
      mergeIncidentList({
        apiItems: tied,
        simulatedIncident: null,
        filters: { ...defaultIncidentFilters, sort: 'oldest' },
      }).map(({ id }) => id),
    ).toEqual(['incident-a', 'incident-z', 'incident-m']);
    expect(
      mergeIncidentList({
        apiItems: tied,
        simulatedIncident: null,
        filters: { ...defaultIncidentFilters, sort: 'severity' },
      }).map(({ id }) => id),
    ).toEqual(['incident-a', 'incident-z', 'incident-m']);
  });

  it('does not mutate API items or the simulated incident', () => {
    const apiItems = structuredClone(incidentsFixture);
    const simulation = structuredClone(simulatedIncident);
    const apiSnapshot = structuredClone(apiItems);
    const simulationSnapshot = structuredClone(simulation);

    mergeIncidentList({
      apiItems,
      simulatedIncident: simulation,
      filters: defaultIncidentFilters,
    });

    expect(apiItems).toEqual(apiSnapshot);
    expect(simulation).toEqual(simulationSnapshot);
  });

  it('keeps a resolved simulated incident when it passes filters', () => {
    const resolved = {
      ...simulatedIncident,
      status: 'resolved',
      resolvedAt: simulatedIncident.updatedAt,
    } satisfies Incident;
    const result = mergeIncidentList({
      apiItems: [],
      simulatedIncident: resolved,
      filters: { ...defaultIncidentFilters, status: 'resolved' },
    });
    expect(result).toEqual([resolved]);
  });
});
