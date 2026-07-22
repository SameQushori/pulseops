import { drizzle } from 'drizzle-orm/d1';

import type { Bindings } from '../env';
import * as schema from './schema';

export function createDatabase(binding: Bindings['DB']) {
  return drizzle(binding, { schema });
}

export type Database = ReturnType<typeof createDatabase>;
