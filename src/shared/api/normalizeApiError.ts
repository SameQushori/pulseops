import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { apiErrorSchema } from './schemas';
import { RESPONSE_VALIDATION_ERROR } from './validation';

export interface UiApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

const fallbackError: UiApiError = {
  code: 'UNKNOWN_ERROR',
  message: 'Something went wrong. Please try again.',
};

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export function normalizeApiError(error: unknown): UiApiError {
  if (isFetchBaseQueryError(error)) {
    if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message:
          'The data service is unavailable. Check your connection and retry.',
      };
    }

    if (error.status === 'PARSING_ERROR') {
      return {
        code: 'INVALID_RESPONSE',
        message: 'The data service returned an unreadable response.',
      };
    }

    if (typeof error.status === 'number') {
      const parsed = apiErrorSchema.safeParse(error.data);
      if (parsed.success) return parsed.data.error;

      return {
        code: 'API_ERROR',
        message: 'The data service could not complete the request.',
      };
    }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    error.message === RESPONSE_VALIDATION_ERROR
  ) {
    return {
      code: 'INVALID_RESPONSE',
      message: 'The data service returned an invalid response.',
    };
  }

  return fallbackError;
}
