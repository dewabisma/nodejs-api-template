import pg from 'pg';

import env from '../../config/index.js';
import logger from '../../loaders/logger.js';

export const recreateDB = async () => {
  const dbName = env.appName.toLowerCase();

  const client = new pg.Client({
    connectionString: env.databaseURL,
  });
  await client.connect();

  logger.info('Recreating DB');

  try {
    logger.info('Dropping existing DB');
    await client.query(`DROP DATABASE ${dbName}`);
  } catch (error) {
    logger.info('DB is already deleted.');
  }

  try {
    logger.info('Creating new DB');
    await client.query(`CREATE DATABASE ${dbName}`);
  } catch (error) {
    logger.info('DB is already created.');
  }

  logger.info('Success recreating DB');
};

if (process.argv[2] === '-start') {
  await recreateDB();
  process.exit();
}
