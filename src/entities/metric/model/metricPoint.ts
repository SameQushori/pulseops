import { z } from 'zod';

export const metricPointSchema = z.object({
  timestamp: z.iso.datetime({ offset: false }),
  latencyMs: z.number().nonnegative().max(60_000),
  errorRate: z.number().min(0).max(100),
  throughput: z.number().nonnegative().max(1_000_000),
});

export type MetricPoint = z.infer<typeof metricPointSchema>;
