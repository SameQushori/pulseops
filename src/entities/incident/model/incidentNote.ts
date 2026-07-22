import { z } from 'zod';

export const incidentNoteSchema = z.object({
  id: z.string().min(1),
  incidentId: z.string().min(1),
  author: z.string().trim().min(2).max(80),
  body: z.string().trim().min(1).max(1000),
  createdAt: z.iso.datetime({ offset: false }),
});

export const addIncidentNoteRequestSchema = incidentNoteSchema.pick({
  author: true,
  body: true,
});

export type IncidentNote = z.infer<typeof incidentNoteSchema>;
export type AddIncidentNoteRequest = z.infer<
  typeof addIncidentNoteRequestSchema
>;
