import { z } from 'zod';

import {
  incidentEventSchema,
  type IncidentEvent,
} from '../../../entities/event/model/incidentEvent';
import {
  incidentSchema,
  type Incident,
} from '../../../entities/incident/model/incident';
import {
  incidentNoteSchema,
  type AddIncidentNoteRequest,
  type IncidentNote,
} from '../../../entities/incident/model/incidentNote';
import {
  metricPointSchema,
  type MetricPoint,
} from '../../../entities/metric/model/metricPoint';

export const SIMULATED_INCIDENT_ID = 'incident-simulated-payments-degradation';
export const PAYMENTS_SERVICE_ID = 'service-payments';
export const DEGRADATION_TICK_MS = 700;
export const INCIDENT_TRANSITION_MS = 600;
export const RECOVERY_TICK_MS = 650;

const virtualStepMs = 5 * 60 * 1000;

const degradationValues = [
  { latencyMs: 188, errorRate: 0.42, throughput: 1260 },
  { latencyMs: 264, errorRate: 0.91, throughput: 1198 },
  { latencyMs: 418, errorRate: 1.86, throughput: 1114 },
  { latencyMs: 612, errorRate: 3.24, throughput: 1038 },
  { latencyMs: 784, errorRate: 4.72, throughput: 972 },
] as const;

const recoveryValues = [
  { latencyMs: 642, errorRate: 3.58, throughput: 1012 },
  { latencyMs: 486, errorRate: 2.31, throughput: 1096 },
  { latencyMs: 326, errorRate: 1.18, throughput: 1184 },
  { latencyMs: 214, errorRate: 0.54, throughput: 1252 },
] as const;

export interface SimulationScenario {
  degradationPoints: MetricPoint[];
  incident: Incident;
  incidentCreatedEvents: IncidentEvent[];
  investigatingEvent: IncidentEvent;
  monitoringEvent: IncidentEvent;
  recoveryPoints: MetricPoint[];
  resolvedEvent: IncidentEvent;
}

function timestampFrom(baseTimestamp: string, step: number) {
  return new Date(
    new Date(baseTimestamp).getTime() + virtualStepMs * step,
  ).toISOString();
}

function detailsTimestamp(incident: Incident, sequence: number) {
  return new Date(
    Date.parse(incident.createdAt) + (3 * 60 + sequence * 10) * 1000,
  ).toISOString();
}

export function buildSimulatedOwnerEvent(
  incident: Incident,
  owner: string | null,
  sequence: number,
) {
  return incidentEventSchema.parse({
    id: `event-simulated-owner-${sequence}`,
    incidentId: incident.id,
    type: 'owner_changed',
    message: `Owner changed to ${owner ?? 'Unassigned'}.`,
    createdAt: detailsTimestamp(incident, sequence),
  });
}

export function buildSimulatedIdentifiedEvent(incident: Incident) {
  return incidentEventSchema.parse({
    id: 'event-simulated-payments-identified',
    incidentId: incident.id,
    type: 'status_changed',
    message: 'Status changed to identified.',
    createdAt: new Date(
      Date.parse(incident.createdAt) + 4 * 60_000,
    ).toISOString(),
  });
}

export function buildSimulatedMonitoringEvent(incident: Incident) {
  return incidentEventSchema.parse({
    id: 'event-simulated-payments-monitoring',
    incidentId: incident.id,
    type: 'status_changed',
    message: 'Recovery started; status changed to monitoring.',
    createdAt: new Date(
      Date.parse(incident.createdAt) + 5 * 60_000,
    ).toISOString(),
  });
}

export function buildSimulatedNote(
  incident: Incident,
  note: AddIncidentNoteRequest,
  sequence: number,
): { note: IncidentNote; event: IncidentEvent } {
  const createdAt = detailsTimestamp(incident, sequence);
  return {
    note: incidentNoteSchema.parse({
      id: `note-simulated-${sequence}`,
      incidentId: incident.id,
      ...note,
      createdAt,
    }),
    event: incidentEventSchema.parse({
      id: `event-simulated-note-${sequence}`,
      incidentId: incident.id,
      type: 'note_added',
      message: `${note.author} added an incident note.`,
      createdAt,
    }),
  };
}

export function buildSimulationScenario(
  baselinePoint: MetricPoint,
): SimulationScenario {
  const degradationPoints = degradationValues.map((values, index) =>
    metricPointSchema.parse({
      timestamp: timestampFrom(baselinePoint.timestamp, index + 1),
      ...values,
    }),
  );
  const recoveryPoints = [
    ...recoveryValues,
    {
      latencyMs: baselinePoint.latencyMs,
      errorRate: baselinePoint.errorRate,
      throughput: baselinePoint.throughput,
    },
  ].map((values, index) =>
    metricPointSchema.parse({
      timestamp: timestampFrom(
        baselinePoint.timestamp,
        degradationPoints.length + index + 1,
      ),
      ...values,
    }),
  );

  const alertTimestamp = degradationPoints[2].timestamp;
  const incidentTimestamp = degradationPoints.at(-1)?.timestamp;
  const investigatingTimestamp = timestampFrom(
    baselinePoint.timestamp,
    degradationPoints.length + 0.5,
  );
  const monitoringTimestamp = recoveryPoints[0].timestamp;
  const resolvedTimestamp = recoveryPoints.at(-1)?.timestamp;

  if (!incidentTimestamp || !resolvedTimestamp) {
    throw new Error('Simulation scenario requires metric points.');
  }

  const incident = incidentSchema.parse({
    id: SIMULATED_INCIDENT_ID,
    title: 'Payments API latency and error-rate degradation',
    summary:
      'Payment authorization latency and error rate crossed the simulated SEV-2 threshold.',
    serviceId: PAYMENTS_SERVICE_ID,
    severity: 'sev2',
    status: 'investigating',
    owner: null,
    startedAt: alertTimestamp,
    resolvedAt: null,
    createdAt: incidentTimestamp,
    updatedAt: incidentTimestamp,
  });

  const incidentCreatedEvents = z.array(incidentEventSchema).parse([
    {
      id: 'event-simulated-payments-alert',
      incidentId: SIMULATED_INCIDENT_ID,
      type: 'metric_alert',
      message: 'Payments API crossed the latency and error-rate threshold.',
      createdAt: alertTimestamp,
    },
    {
      id: 'event-simulated-payments-created',
      incidentId: SIMULATED_INCIDENT_ID,
      type: 'created',
      message: 'SEV-2 incident created for Payments API degradation.',
      createdAt: incidentTimestamp,
    },
  ]);

  return {
    degradationPoints,
    incident,
    incidentCreatedEvents,
    investigatingEvent: incidentEventSchema.parse({
      id: 'event-simulated-payments-investigating',
      incidentId: SIMULATED_INCIDENT_ID,
      type: 'status_changed',
      message: 'Status changed to investigating.',
      createdAt: investigatingTimestamp,
    }),
    monitoringEvent: incidentEventSchema.parse({
      id: 'event-simulated-payments-monitoring',
      incidentId: SIMULATED_INCIDENT_ID,
      type: 'status_changed',
      message: 'Recovery started; status changed to monitoring.',
      createdAt: monitoringTimestamp,
    }),
    recoveryPoints,
    resolvedEvent: incidentEventSchema.parse({
      id: 'event-simulated-payments-resolved',
      incidentId: SIMULATED_INCIDENT_ID,
      type: 'status_changed',
      message: 'Payments API recovered; incident resolved.',
      createdAt: resolvedTimestamp,
    }),
  };
}
