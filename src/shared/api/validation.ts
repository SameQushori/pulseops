import { ZodError, type ZodType } from 'zod';

export const RESPONSE_VALIDATION_ERROR = 'Response validation failed';

export function parseApiResponse<T>(schema: ZodType<T>, response: unknown): T {
  try {
    return schema.parse(response);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(RESPONSE_VALIDATION_ERROR, { cause: error });
    }
    throw error;
  }
}
