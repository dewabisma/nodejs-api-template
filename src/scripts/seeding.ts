import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import env from '@/config/index.js';
import * as schemas from '@/modules/models.js';
import logger from '@/loaders/logger.js';
import generateFakeData from '@/utils/generateFakeData.js';

export const seedDB = async () => {
  logger.info('Seeding DB');

  const client = new pg.Client({
    connectionString: env.databaseURI,
  });

  await client.connect();

  const db = drizzle(client, { schema: schemas });

  /**
   * Be care ful setting the amount. Max should be 100. Because it will result in too big of data.
   */
  const seedData = generateFakeData(10);

  logger.info('Seeding base tables');

  // Base Table
  await Promise.all([
    db.insert(schemas.users).values(seedData.users),
    db.insert(schemas.promotions).values(seedData.promotions),
  ]);

  logger.info('Success seeding base tables');

  logger.info('Success seeding DB');
};

if (process.argv[2] === '-start') {
  await seedDB();
  process.exit();
}
