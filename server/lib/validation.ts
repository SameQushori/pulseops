import type { Context } from 'hono';
import type { ZodError, ZodType } from 'zod';

import type { AppEnv } from '../env';
import { ApiException } from './errors';

function fieldErrors(error: ZodError) {
  return Object.fromEntries(
    error.issues.map((issue) => [
      issue.path.join('.') || 'request',
      issue.message,
    ]),
  );
}

export function parseInput<T>(schema: ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiException(
      422,
      'VALIDATION_ERROR',
      'The request is invalid.',
      fieldErrors(parsed.error),
    );
  }
  return parsed.data;
}

export async function parseJson<T>(
  context: Context<AppEnv>,
  schema: ZodType<T>,
) {
  let value: unknown;
  try {
    value = await context.req.json();
  } catch {
    throw new ApiException(
      400,
      'MALFORMED_JSON',
      'The request body must be valid JSON.',
    );
  }
  return parseInput(schema, value);
}

export function parseResponse<T>(schema: ZodType<T>, value: unknown) {
  return schema.parse(value);
}
