import { z } from 'zod';

import { incidentEventSchema } from '../../event/model/incidentEvent';
import { serviceSchema } from '../../service/model/service';
import { incidentSchema } from './incident';
import { incidentNoteSchema } from './incidentNote';

export const incidentDetailsResponseSchema = z.object({
  incident: incidentSchema,
  service: serviceSchema,
  timeline: z.array(incidentEventSchema),
  notes: z.array(incidentNoteSchema),
});

export type IncidentDetailsResponse = z.infer<
  typeof incidentDetailsResponseSchema
>;
