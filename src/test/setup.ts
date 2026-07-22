import '@testing-library/jest-dom/vitest';

import { resetMockDatabase } from '../shared/api/mocks/mockDatabase';
import { mockServer } from '../shared/api/mocks/server';

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  mockServer.resetHandlers();
  resetMockDatabase();
});
afterAll(() => mockServer.close());
