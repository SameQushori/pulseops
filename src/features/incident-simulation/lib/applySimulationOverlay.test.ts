import { overviewResponseSchema } from '../../overview-data/model/overview';
import { overviewFixture } from '../../../shared/api/mocks/fixtures';
import { metricPointSchema } from '../../../entities/metric/model/metricPoint';
import type { Incident } from '../../../entities/incident/model/incident';
import { buildSimulationScenario } from '../model/simulationScenario';
import {
  initialSimulationState,
  type SimulationState,
} from '../model/simulationSlice';
import { applySimulationOverlay } from './applySimulationOverlay';

const baselinePoint = metricPointSchema.parse(overviewFixture.metrics.at(-1));
const scenario = buildSimulationScenario(baselinePoint);

function stateFor(overrides: Partial<SimulationState>): SimulationState {
  return { ...initialSimulationState, runId: 1, ...overrides };
}

describe('applySimulationOverlay', () => {
  it('does not mutate the API snapshot', () => {
    const source = structuredClone(overviewFixture);
    const frozenInput = structuredClone(overviewFixture);
    const output = applySimulationOverlay(
      frozenInput,
      stateFor({
        phase: 'degrading',
        appendedMetricPoints: scenario.degradationPoints,
        serviceStatusOverride: 'degraded',
      }),
    );

    expect(frozenInput).toEqual(source);
    expect(output).not.toBe(frozenInput);
    expect(output.metrics).not.toBe(frozenInput.metrics);
  });

  it.each([
    ['degrading', 'degraded'],
    ['incident-created', 'degraded'],
    ['investigating', 'degraded'],
    ['recovering', 'degraded'],
    ['resolved', 'operational'],
  ] as const)('returns schema-compatible %s output', (phase, status) => {
    const incident: Incident | null =
      phase === 'degrading'
        ? null
        : {
            ...scenario.incident,
            status: phase === 'resolved' ? 'resolved' : 'investigating',
            resolvedAt:
              phase === 'resolved' ? scenario.resolvedEvent.createdAt : null,
          };
    const output = applySimulationOverlay(
      overviewFixture,
      stateFor({
        phase,
        appendedMetricPoints:
          phase === 'recovering' || phase === 'resolved'
            ? [...scenario.degradationPoints, ...scenario.recoveryPoints]
            : scenario.degradationPoints,
        simulatedIncident: incident,
        generatedEvents: scenario.incidentCreatedEvents,
        serviceStatusOverride:
          phase === 'resolved' ? 'operational' : 'degraded',
      }),
    );

    expect(output.status).toBe(status);
    expect(overviewResponseSchema.safeParse(output).success).toBe(true);
  });

  it('updates KPI, Payments API, events and unique metric timestamps', () => {
    const output = applySimulationOverlay(
      overviewFixture,
      stateFor({
        phase: 'investigating',
        appendedMetricPoints: [
          ...scenario.degradationPoints,
          scenario.degradationPoints[0],
        ],
        simulatedIncident: scenario.incident,
        generatedEvents: scenario.incidentCreatedEvents,
        serviceStatusOverride: 'degraded',
      }),
    );

    expect(output.kpis).toMatchObject({
      latencyMs: scenario.degradationPoints[0].latencyMs,
      activeIncidents: overviewFixture.kpis.activeIncidents + 1,
    });
    expect(
      output.services.find((service) => service.id === 'service-payments')
        ?.status,
    ).toBe('degraded');
    expect(output.recentEvents[0].incidentId).toBe(scenario.incident.id);
    const timestamps = output.metrics.map((point) => point.timestamp);
    expect(new Set(timestamps).size).toBe(timestamps.length);
  });

  it('returns baseline active incidents after resolution', () => {
    const output = applySimulationOverlay(
      overviewFixture,
      stateFor({
        phase: 'resolved',
        appendedMetricPoints: [
          ...scenario.degradationPoints,
          ...scenario.recoveryPoints,
        ],
        simulatedIncident: {
          ...scenario.incident,
          status: 'resolved',
          resolvedAt: scenario.resolvedEvent.createdAt,
        },
        serviceStatusOverride: 'operational',
      }),
    );

    expect(output.status).toBe('operational');
    expect(output.kpis.activeIncidents).toBe(
      overviewFixture.kpis.activeIncidents,
    );
    expect(output.kpis.latencyMs).toBe(baselinePoint.latencyMs);
  });
});
