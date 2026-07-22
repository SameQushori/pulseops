import { Hono } from 'hono';

import { healthResponseSchema } from '../../src/shared/api/schemas';
import type { AppEnv } from '../env';
import { parseResponse } from '../lib/validation';

export const healthRoutes = new Hono<AppEnv>().get('/', async (context) => {
  await context.env.DB.prepare('SELECT 1 AS ok').first();
  return context.json(
    parseResponse(healthResponseSchema, {
      status: 'ok',
    }),
  );
});
