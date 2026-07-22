import { z } from 'zod';

import { incidentEventSchema } from '../../../entities/event/model/incidentEvent';
import { metricPointSchema } from '../../../entities/metric/model/metricPoint';
import { serviceSchema } from '../../../entities/service/model/service';

export const overallStatusSchema = z.enum([
  'operational',
  'degraded',
  'outage',
]);

export const overviewKpisSchema = z.object({
  latencyMs: z.number().nonnegative().max(60_000),
  errorRate: z.number().min(0).max(100),
  throughput: z.number().nonnegative().max(1_000_000),
  activeIncidents: z.number().int().nonnegative(),
});

export const overviewResponseSchema = z.object({
  status: overallStatusSchema,
  kpis: overviewKpisSchema,
  services: z.array(serviceSchema),
  metrics: z.array(metricPointSchema),
  recentEvents: z.array(incidentEventSchema),
});

export type OverallStatus = z.infer<typeof overallStatusSchema>;
export type OverviewKpis = z.infer<typeof overviewKpisSchema>;
export type OverviewResponse = z.infer<typeof overviewResponseSchema>;
