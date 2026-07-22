import { z } from 'zod';

export const incidentEventTypeSchema = z.enum([
  'created',
  'status_changed',
  'owner_changed',
  'note_added',
  'metric_alert',
]);

export const incidentEventSchema = z.object({
  id: z.string().min(1),
  incidentId: z.string().min(1),
  type: incidentEventTypeSchema,
  message: z.string().min(1),
  createdAt: z.iso.datetime({ offset: false }),
});

export type IncidentEvent = z.infer<typeof incidentEventSchema>;
