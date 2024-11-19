import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import env from '../config/index.js';
import * as schemas from '@/modules/models.js';

export default async () => {
  const client = new pg.Client({
    connectionString: env.databaseURI,
  });
  await client.connect();

  const db = drizzle(client, { schema: schemas });
  return db;
};
