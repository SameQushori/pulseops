import { z } from 'zod';

export const incidentSeveritySchema = z.enum(['sev1', 'sev2', 'sev3']);
export const incidentStatusSchema = z.enum([
  'investigating',
  'identified',
  'monitoring',
  'resolved',
]);

export const incidentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  serviceId: z.string().min(1),
  severity: incidentSeveritySchema,
  status: incidentStatusSchema,
  owner: z.string().min(1).nullable(),
  startedAt: z.iso.datetime({ offset: false }),
  resolvedAt: z.iso.datetime({ offset: false }).nullable(),
  createdAt: z.iso.datetime({ offset: false }),
  updatedAt: z.iso.datetime({ offset: false }),
});

export const updateIncidentRequestSchema = z
  .object({
    status: incidentStatusSchema.optional(),
    owner: z.string().trim().min(1).nullable().optional(),
  })
  .refine((value) => value.status !== undefined || value.owner !== undefined, {
    message: 'At least one field is required',
  });

export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;
export type Incident = z.infer<typeof incidentSchema>;
export type UpdateIncidentRequest = z.infer<typeof updateIncidentRequestSchema>;
