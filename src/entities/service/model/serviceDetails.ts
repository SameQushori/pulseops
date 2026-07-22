import { z } from 'zod';

import { incidentSchema } from '../../incident/model/incident';
import { metricPointSchema } from '../../metric/model/metricPoint';
import { serviceSchema } from './service';

export const serviceDetailsResponseSchema = z
  .object({
    service: serviceSchema,
    dependencies: z.array(serviceSchema),
    incidents: z.array(incidentSchema),
    metrics: z.array(metricPointSchema),
  })
  .superRefine(({ dependencies, service }, context) => {
    const dependencyIds = new Set<string>();
    dependencies.forEach((dependency, index) => {
      if (dependency.id === service.id) {
        context.addIssue({
          code: 'custom',
          message: 'A service cannot depend on itself.',
          path: ['dependencies', index, 'id'],
        });
      }
      if (dependencyIds.has(dependency.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Dependency IDs must be unique.',
          path: ['dependencies', index, 'id'],
        });
      }
      dependencyIds.add(dependency.id);
    });
  });

export type ServiceDetailsResponse = z.infer<
  typeof serviceDetailsResponseSchema
>;
