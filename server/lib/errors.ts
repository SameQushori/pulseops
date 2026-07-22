import type { Context } from 'hono';

import type { AppEnv } from '../env';

export class ApiException extends Error {
  constructor(
    readonly status: 400 | 404 | 422,
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

export function notFound(entity?: 'incident' | 'service') {
  return new ApiException(
    404,
    'NOT_FOUND',
    entity
      ? `The requested ${entity} was not found.`
      : 'The requested route was not found.',
  );
}

export function errorResponse(context: Context<AppEnv>, error: ApiException) {
  return context.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      },
    },
    error.status,
  );
}
