import { normalizeApiError } from './normalizeApiError';

describe('normalizeApiError', () => {
  it('normalizes network failures', () => {
    expect(
      normalizeApiError({ status: 'FETCH_ERROR', error: 'private details' }),
    ).toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('preserves safe API errors', () => {
    expect(
      normalizeApiError({
        status: 422,
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid',
            fieldErrors: { body: 'Required' },
          },
        },
      }),
    ).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid',
      fieldErrors: { body: 'Required' },
    });
  });

  it('hides malformed and unknown errors', () => {
    expect(normalizeApiError({ status: 500, data: '<html>' })).toMatchObject({
      code: 'API_ERROR',
    });
    expect(normalizeApiError(new Error('secret'))).toMatchObject({
      code: 'UNKNOWN_ERROR',
    });
  });
});
