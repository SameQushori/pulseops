import type { Incident } from '../../../entities/incident/model/incident';
import type { Service } from '../../../entities/service/model/service';
import type { ServiceDetailsResponse } from '../../../entities/service/model/serviceDetails';
import type { SimulationState } from '../model/simulationSlice';
import { PAYMENTS_SERVICE_ID } from '../model/simulationScenario';

export interface ServiceWithSimulation extends Service {
  hasSimulationOverride: boolean;
  isSimulatedStatus: boolean;
}

export interface ServiceDetailsWithSimulation extends Omit<
  ServiceDetailsResponse,
  'service' | 'dependencies'
> {
  service: ServiceWithSimulation;
  dependencies: ServiceWithSimulation[];
}

export function applyServiceStatusOverlay(
  services: readonly Service[],
  simulation: Pick<SimulationState, 'serviceStatusOverride'>,
): ServiceWithSimulation[] {
  return services.map((service) => {
    const override =
      service.id === PAYMENTS_SERVICE_ID
        ? simulation.serviceStatusOverride
        : null;
    return {
      ...service,
      ...(override ? { status: override } : {}),
      hasSimulationOverride: Boolean(override),
      isSimulatedStatus: Boolean(override && override !== service.status),
    };
  });
}

export function mergeSimulatedServiceIncident(
  incidents: readonly Incident[],
  serviceId: string,
  simulatedIncident: Incident | null,
) {
  const merged = new Map(incidents.map((incident) => [incident.id, incident]));
  if (
    simulatedIncident?.serviceId === serviceId &&
    serviceId === PAYMENTS_SERVICE_ID
  ) {
    merged.set(simulatedIncident.id, simulatedIncident);
  }
  return [...merged.values()].sort(
    (left, right) =>
      right.startedAt.localeCompare(left.startedAt) ||
      left.id.localeCompare(right.id),
  );
}

export function applyServiceDetailsSimulationOverlay(
  details: ServiceDetailsResponse,
  simulation: Pick<
    SimulationState,
    'serviceStatusOverride' | 'simulatedIncident'
  >,
): ServiceDetailsWithSimulation {
  const [service] = applyServiceStatusOverlay([details.service], simulation);
  if (!service) {
    throw new Error('Service details require a service record.');
  }
  return {
    ...details,
    service,
    dependencies: applyServiceStatusOverlay(details.dependencies, simulation),
    incidents: mergeSimulatedServiceIncident(
      details.incidents,
      details.service.id,
      simulation.simulatedIncident,
    ),
  };
}
