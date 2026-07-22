import { overviewResponseSchema } from '../../overview-data/model/overview';
import type { OverviewResponse } from '../../overview-data/model/overview';
import type { SimulationState } from '../model/simulationSlice';
import { PAYMENTS_SERVICE_ID } from '../model/simulationScenario';

export function applySimulationOverlay(
  apiOverview: OverviewResponse,
  simulation: SimulationState,
): OverviewResponse {
  if (simulation.phase === 'idle') return apiOverview;

  const pointsByTimestamp = new Map(
    apiOverview.metrics.map((point) => [point.timestamp, point]),
  );
  simulation.appendedMetricPoints.forEach((point) =>
    pointsByTimestamp.set(point.timestamp, point),
  );
  const metrics = [...pointsByTimestamp.values()].sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
  const latestPoint = simulation.appendedMetricPoints.at(-1);
  const incidentIsActive =
    simulation.simulatedIncident !== null &&
    simulation.simulatedIncident.status !== 'resolved';
  const generatedEvents = [...simulation.generatedEvents].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );

  return overviewResponseSchema.parse({
    ...apiOverview,
    status:
      simulation.phase === 'resolved'
        ? 'operational'
        : simulation.serviceStatusOverride === null &&
            simulation.phase === 'degrading'
          ? apiOverview.status
          : 'degraded',
    kpis: {
      latencyMs: latestPoint?.latencyMs ?? apiOverview.kpis.latencyMs,
      errorRate: latestPoint?.errorRate ?? apiOverview.kpis.errorRate,
      throughput: latestPoint?.throughput ?? apiOverview.kpis.throughput,
      activeIncidents:
        apiOverview.kpis.activeIncidents + (incidentIsActive ? 1 : 0),
    },
    services: apiOverview.services.map((service) =>
      service.id === PAYMENTS_SERVICE_ID &&
      simulation.serviceStatusOverride !== null
        ? { ...service, status: simulation.serviceStatusOverride }
        : service,
    ),
    metrics,
    recentEvents: [...generatedEvents, ...apiOverview.recentEvents].sort(
      (left, right) => right.createdAt.localeCompare(left.createdAt),
    ),
  });
}
