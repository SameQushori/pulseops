import { Hono } from 'hono';

import type { AppEnv } from './env';
import { ApiException, errorResponse } from './lib/errors';
import { healthRoutes } from './routes/health';
import { incidentRoutes } from './routes/incidents';
import { overviewRoutes } from './routes/overview';
import { serviceRoutes } from './routes/services';

export const app = new Hono<AppEnv>().basePath('/api');

app.use('*', async (context, next) => {
  await next();
  context.header('Content-Type', 'application/json; charset=UTF-8');
});

app.route('/health', healthRoutes);
app.route('/overview', overviewRoutes);
app.route('/incidents', incidentRoutes);
app.route('/services', serviceRoutes);

app.notFound((context) =>
  errorResponse(
    context,
    new ApiException(404, 'NOT_FOUND', 'The requested route was not found.'),
  ),
);

app.onError((error, context) => {
  if (error instanceof ApiException) return errorResponse(context, error);
  console.error('Unhandled API error', error);
  return context.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    },
    500,
  );
});
