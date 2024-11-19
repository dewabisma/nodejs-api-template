/* eslint-disable @typescript-eslint/no-explicit-any */
import expressLoader from './express.js';
import postgreSqlLoader from './psql.js';
import dependencyInjectorLoader from './dependencyInjector.js';
import * as schemas from '@/modules/models.js';
import logger from './logger.js';

export default async ({ expressApp }) => {
  const psqlConnection = await postgreSqlLoader();
  logger.info('PostgreSQL Intialized');

  const models = Object.entries(schemas).map((val) => ({
    // @dev we make it as any type because typescript infer the type wrong, each schema has name that can be used actually.
    name: val[0],
    model: val[1],
  }));
  dependencyInjectorLoader({ psqlConnection, models });
  logger.info('Dependency Injector loaded');

  await expressLoader({ app: expressApp });
  logger.info('Express App Intialized');
};
