import { z } from 'zod';

export const serviceStatusSchema = z.enum([
  'operational',
  'degraded',
  'outage',
]);

export const serviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  status: serviceStatusSchema,
  sloTarget: z.number().min(90).max(100),
  uptime30d: z.number().min(0).max(100),
  lastDeployAt: z.iso.datetime({ offset: false }),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type Service = z.infer<typeof serviceSchema>;
