import { incidentEventSchema } from '../../src/entities/event/model/incidentEvent';
import { incidentSchema } from '../../src/entities/incident/model/incident';
import { incidentNoteSchema } from '../../src/entities/incident/model/incidentNote';
import { metricPointSchema } from '../../src/entities/metric/model/metricPoint';
import { serviceSchema } from '../../src/entities/service/model/service';

import type {
  incidentEvents,
  incidentNotes,
  incidents,
  metricSnapshots,
  services,
} from './schema';

type ServiceRow = typeof services.$inferSelect;
type IncidentRow = typeof incidents.$inferSelect;
type IncidentEventRow = typeof incidentEvents.$inferSelect;
type IncidentNoteRow = typeof incidentNotes.$inferSelect;
type MetricSnapshotRow = typeof metricSnapshots.$inferSelect;

export const mapService = (row: ServiceRow) => serviceSchema.parse(row);
export const mapIncident = (row: IncidentRow) => incidentSchema.parse(row);
export const mapIncidentEvent = (row: IncidentEventRow) =>
  incidentEventSchema.parse(row);
export const mapIncidentNote = (row: IncidentNoteRow) =>
  incidentNoteSchema.parse(row);
export const mapMetricPoint = ({
  timestamp,
  latencyMs,
  errorRate,
  throughput,
}: MetricSnapshotRow) =>
  metricPointSchema.parse({
    timestamp,
    latencyMs,
    errorRate,
    throughput,
  });
