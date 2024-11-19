import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

import env from '@/config/index.js';
import * as schemas from '@/modules/models.js';
import logger from '@/loaders/logger.js';

export const migrateDB = async () => {
  const client = new pg.Client({
    connectionString: env.databaseURI,
  });

  await client.connect();

  const db = drizzle(client, { schema: schemas });

  logger.info('Migrating DB');
  await migrate(db, { migrationsFolder: './src/models/migration' });
  logger.info('Success migrating DB');
};

if (process.argv[2] === '-start') {
  await migrateDB();
  process.exit();
}
